import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  type PlanName,
  countUserMessagesSince,
  countUserMessagesToday,
  getModelBySlug,
  getNextCreditsResetMs,
  getPlanDoc,
  getProfileM,
  isActuallyFreeModel,
  requireIdentity,
  startOfUtcMonthMs,
  sumLedgerM,
} from "./helpers";

function normalizeTitleSource(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/^(hi|hello|hey)[,!.\s]+/i, "")
    .trim();
}

function deriveChatTitleFromUserMessages(messages: string[]): string {
  const cleaned = messages
    .map(normalizeTitleSource)
    .filter((message) => message.length > 0);

  if (cleaned.length === 0) return "New chat";

  const preferred =
    cleaned.find((message) => message.length >= 20) ??
    cleaned[cleaned.length - 1] ??
    cleaned[0];

  const sentence =
    preferred.split(/(?<=[.?!])\s/)[0]?.trim() ||
    preferred;

  return sentence.slice(0, 52).trim() || "New chat";
}

export const prepareToSend = mutation({
  args: {
    chatId: v.optional(v.id("chats")),
    modelId: v.string(),
    message: v.string(),
    regenerate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfileM(ctx, identity.subject);
    if (!profile) {
      throw new ConvexError({ code: "not_found", message: "Profile not found" });
    }

    const model = await getModelBySlug(ctx, args.modelId);
    if (!model || !model.enabled) {
      throw new ConvexError({ code: "not_found", message: "Model not available" });
    }
    if (profile.plan_name === "free" && !model.free_plan_allowed) {
      throw new ConvexError({
        code: "forbidden",
        message: "This model is not available on the free plan. Upgrade to access premium models.",
      });
    }

    const plan = await getPlanDoc(ctx, profile.plan_name as PlanName);
    if (args.message.length > plan.max_message_length) {
      throw new ConvexError({
        code: "too_large",
        message: `Message exceeds ${plan.max_message_length} characters for your plan.`,
      });
    }

    const sentToday = await countUserMessagesToday(ctx, identity.subject);
    if (sentToday >= plan.daily_message_limit) {
      throw new ConvexError({
        code: "rate_limited",
        message: `You've hit your daily limit of ${plan.daily_message_limit} messages. Resets at 00:00 UTC.`,
      });
    }

    const twoHoursMs = 2 * 60 * 60 * 1000;
    const sentRecently = await countUserMessagesSince(
      ctx,
      identity.subject,
      Date.now() - twoHoursMs,
    );
    const burstLimit =
      ("messages_per_2h_limit" in plan
        ? plan.messages_per_2h_limit
        : undefined) ?? Math.max(1, Math.ceil(plan.daily_message_limit / 6));
    if (sentRecently >= burstLimit) {
      throw new ConvexError({
        code: "rate_limited",
        message: `You've reached your hourly limit. Take a short break and your messages will reset soon.`,
      });
    }

    const freeModel = isActuallyFreeModel(model);

    if (!freeModel) {
      const monthStart = startOfUtcMonthMs();
      const usageRows = await ctx.db
        .query("api_usage")
        .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
        .collect();
      const monthlyCost = usageRows
        .filter((row) => row._creationTime >= monthStart)
        .reduce((sum, row) => sum + Number(row.estimated_api_cost ?? 0), 0);
      const projectedCost = monthlyCost + Number(model.estimated_cost_per_message_usd ?? 0);
      if (projectedCost > plan.monthly_api_budget_usd) {
        if (profile.plan_name === "free") {
          throw new ConvexError({
            code: "payment_required",
            message: "You've reached this month's free usage. Upgrade to keep chatting.",
          });
        }
        if (model.category !== "small" && model.category !== "standard") {
          throw new ConvexError({
            code: "payment_required",
            message:
              "You're approaching this month's usage cap on premium models. Switch to a smaller model or buy a credit add-on.",
          });
        }
      }
    }

    const balance = await sumLedgerM(ctx, identity.subject);
    const cost = freeModel ? 0 : model.credit_cost_per_message;
    if (!freeModel && balance < cost) {
      const resetMs = await getNextCreditsResetMs(ctx, identity.subject);
      const resetText = resetMs
        ? ` Credits reset on ${new Date(resetMs).toLocaleDateString(undefined, { dateStyle: "medium" })}.`
        : profile.plan_name === "free"
          ? " Upgrade your plan or pick a free model to keep chatting."
          : "";
      throw new ConvexError({
        code: "payment_required",
        message: `Not enough credits. This message costs ${cost}, you have ${balance}.${resetText}`,
      });
    }

    const now = Date.now();
    let chatId = args.chatId;
    if (!chatId) {
      const title = deriveChatTitleFromUserMessages([args.message]);
      chatId = await ctx.db.insert("chats", {
        user_id: identity.subject,
        title,
        last_activity: now,
      });
    } else {
      const chat = await ctx.db.get(chatId);
      if (!chat || chat.user_id !== identity.subject) {
        throw new ConvexError({ code: "not_found", message: "Chat not found" });
      }
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat_id", chatId))
      .collect();
    let sortedMessages = messages.sort((a, b) => a._creationTime - b._creationTime);

    if (args.regenerate) {
      const lastAssistant = [...sortedMessages].reverse().find((message) => message.role === "assistant");
      if (lastAssistant) {
        await ctx.db.delete(lastAssistant._id);
        sortedMessages = sortedMessages.filter((message) => message._id !== lastAssistant._id);
      }
    }

    if (sortedMessages.length >= plan.max_conversation_length) {
      throw new ConvexError({
        code: "too_large",
        message: `Conversation is at the ${plan.max_conversation_length} message cap for your plan. Start a new chat.`,
      });
    }

    let userMessageId;
    if (args.regenerate) {
      const latest = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chat_id", chatId))
        .collect();
      const lastUser = latest
        .sort((a, b) => a._creationTime - b._creationTime)
        .reverse()
        .find((message) => message.role === "user");
      if (!lastUser) {
        throw new ConvexError({ code: "bad_request", message: "Nothing to regenerate" });
      }
      userMessageId = lastUser._id;
    } else {
      userMessageId = await ctx.db.insert("messages", {
        chat_id: chatId,
        user_id: identity.subject,
        role: "user",
        content: args.message,
        model_id: model.model_id,
        credits_used: 0,
        estimated_api_cost: 0,
      });
    }

    if (cost > 0) {
      await ctx.db.insert("credits_ledger", {
        user_id: identity.subject,
        amount: -Math.abs(cost),
        type: "deduction",
        description: `chat:${model.model_id}`,
        related_message_id: userMessageId,
      });
    }

    const assistantMessageId = await ctx.db.insert("messages", {
      chat_id: chatId,
      user_id: identity.subject,
      role: "assistant",
      content: "",
      model_id: model.model_id,
      credits_used: cost,
      estimated_api_cost: model.estimated_cost_per_message_usd,
    });

    // Only bump activity here. The title is set once on chat creation as a
    // raw-message placeholder, and is replaced by an AI-generated title from
    // `internal.chats.generateChatTitle` after the first assistant reply.
    // Re-deriving the title on every send would clobber both that AI title
    // and any manual rename the user has made.
    await ctx.db.patch(chatId, { last_activity: now });

    const history = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat_id", chatId))
      .collect();
    const turns = history
      .sort((a, b) => a._creationTime - b._creationTime)
      .filter((message) => message._id !== assistantMessageId)
      .map((message) => ({
        role: message.role as "user" | "assistant" | "system",
        content: message.content,
      }));

    return {
      chatId,
      assistantMessageId,
      userMessageId,
      cost,
      model: {
        model_id: model.model_id,
        provider: model.provider,
        estimated_cost_per_message_usd: model.estimated_cost_per_message_usd,
        supports_vision: model.supports_vision ?? false,
        supports_files: model.supports_files ?? false,
      },
      turns,
    };
  },
});

export const finalizeSend = mutation({
  args: {
    chatId: v.id("chats"),
    assistantMessageId: v.id("messages"),
    provider: v.string(),
    modelId: v.string(),
    creditsCharged: v.number(),
    estimatedApiCost: v.number(),
    actualCreditsCharged: v.optional(v.number()),
    actualApiCost: v.optional(v.number()),
    content: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    citations: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.optional(v.string()),
          content: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const assistantMessage = await ctx.db.get(args.assistantMessageId);
    if (!assistantMessage || assistantMessage.user_id !== identity.subject) {
      throw new ConvexError({ code: "not_found", message: "Message not found" });
    }

    const settledCredits = args.actualCreditsCharged ?? args.creditsCharged;
    const settledApiCost = args.actualApiCost ?? args.estimatedApiCost;
    const delta = settledCredits - args.creditsCharged;

    if (delta !== 0) {
      await ctx.db.insert("credits_ledger", {
        user_id: identity.subject,
        amount: -delta,
        type: delta > 0 ? "deduction" : "refund",
        description:
          delta > 0
            ? `Usage adjustment: ${args.modelId}`
            : `Usage refund: ${args.modelId}`,
        related_message_id: args.assistantMessageId,
      });
    }

    await ctx.db.patch(args.assistantMessageId, {
      content: args.content,
      // Persist the model that actually answered. In auto-router mode this is
      // the concrete model OpenRouter picked (e.g. "anthropic/claude-…") and
      // not the "openrouter/auto" placeholder we saved in prepareToSend.
      model_id: args.modelId,
      credits_used: settledCredits,
      estimated_api_cost: settledApiCost,
      ...(args.citations && args.citations.length > 0
        ? { citations: args.citations }
        : {}),
    });
    await ctx.db.patch(args.chatId, { last_activity: Date.now() });
    await ctx.db.insert("api_usage", {
      user_id: identity.subject,
      chat_id: args.chatId,
      message_id: args.assistantMessageId,
      provider: args.provider,
      model_id: args.modelId,
      credits_charged: settledCredits,
      estimated_api_cost: settledApiCost,
      prompt_tokens: args.promptTokens,
      completion_tokens: args.completionTokens,
      status: "ok",
    });

    // First successful assistant reply in this chat? Kick off a ChatGPT-style
    // title summarization. We trigger only on the first one so we never
    // overwrite a title the user has manually renamed later.
    const assistantCount = (
      await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chat_id", args.chatId))
        .collect()
    ).filter(
      (m) => m.role === "assistant" && m.content.trim().length > 0,
    ).length;
    if (assistantCount === 1) {
      await ctx.scheduler.runAfter(0, internal.chats.generateChatTitle, {
        chatId: args.chatId,
      });
    }

    return null;
  },
});

export const failSend = mutation({
  args: {
    chatId: v.id("chats"),
    assistantMessageId: v.id("messages"),
    provider: v.string(),
    modelId: v.string(),
    creditsCharged: v.number(),
    estimatedApiCost: v.number(),
    actualCreditsCharged: v.optional(v.number()),
    actualApiCost: v.optional(v.number()),
    errorMessage: v.string(),
    partialContent: v.optional(v.string()),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const assistantMessage = await ctx.db.get(args.assistantMessageId);
    if (!assistantMessage || assistantMessage.user_id !== identity.subject) {
      throw new ConvexError({ code: "not_found", message: "Message not found" });
    }

    const partial = args.partialContent?.trim() ?? "";
    const settledCredits = args.actualCreditsCharged ?? (partial.length > 0 ? args.creditsCharged : 0);
    const settledApiCost = args.actualApiCost ?? (partial.length > 0 ? args.estimatedApiCost : 0);
    const delta = settledCredits - args.creditsCharged;
    if (partial.length > 0) {
      if (delta !== 0) {
        await ctx.db.insert("credits_ledger", {
          user_id: identity.subject,
          amount: -delta,
          type: delta > 0 ? "deduction" : "refund",
          description:
            delta > 0
              ? `Usage adjustment: ${args.modelId}`
              : `Usage refund: ${args.modelId}`,
          related_message_id: args.assistantMessageId,
        });
      }

      await ctx.db.patch(args.assistantMessageId, {
        content: partial,
        model_id: args.modelId,
        credits_used: settledCredits,
        estimated_api_cost: settledApiCost,
      });
      await ctx.db.patch(args.chatId, { last_activity: Date.now() });
      await ctx.db.insert("api_usage", {
        user_id: identity.subject,
        chat_id: args.chatId,
        message_id: args.assistantMessageId,
        provider: args.provider,
        model_id: args.modelId,
        credits_charged: settledCredits,
        estimated_api_cost: settledApiCost,
        prompt_tokens: args.promptTokens,
        completion_tokens: args.completionTokens,
        status: "partial",
        error_message: args.errorMessage,
      });
      return null;
    }

    if (args.creditsCharged !== 0) {
      await ctx.db.insert("credits_ledger", {
        user_id: identity.subject,
        amount: Math.abs(args.creditsCharged),
        type: "refund",
        description: `Refund: ${args.errorMessage}`,
        related_message_id: args.assistantMessageId,
      });
    }
    await ctx.db.delete(args.assistantMessageId);
    await ctx.db.insert("api_usage", {
      user_id: identity.subject,
      chat_id: args.chatId,
      message_id: args.assistantMessageId,
      provider: args.provider,
      model_id: args.modelId,
      credits_charged: 0,
      estimated_api_cost: 0,
      status: "error",
      error_message: args.errorMessage,
    });
    return null;
  },
});
