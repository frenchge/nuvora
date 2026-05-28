import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { mapChat, mapMessage, requireIdentity } from "./helpers";

export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user_activity", (q) => q.eq("user_id", identity.subject))
      .collect();

    return chats
      .sort((a, b) => b.last_activity - a.last_activity)
      .slice(0, 50)
      .map(mapChat);
  },
});

export const getThread = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.user_id !== identity.subject) {
      return null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat_id", args.chatId))
      .collect();

    return {
      chat: mapChat(chat),
      messages: messages
        .sort((a, b) => a._creationTime - b._creationTime)
        .map(mapMessage),
    };
  },
});

export const rename = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.user_id !== identity.subject) {
      throw new Error("Chat not found");
    }

    await ctx.db.patch(args.chatId, {
      title: args.title.trim() || "Untitled",
      last_activity: Date.now(),
    });

    const updated = await ctx.db.get(args.chatId);
    if (!updated) throw new Error("Chat not found after rename");
    return mapChat(updated);
  },
});

export const togglePin = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.user_id !== identity.subject) {
      throw new Error("Chat not found");
    }
    await ctx.db.patch(args.chatId, { pinned: !(chat.pinned ?? false) });
    return null;
  },
});

// ── AI-generated chat titles ────────────────────────────────────────────────
// After the first assistant reply lands, we summarize the exchange into a
// short ChatGPT-style title (e.g. "Vacation planning ideas") instead of
// leaving the raw user message as the conversation name.

export const getChatForTitle = internalQuery({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat_id", args.chatId))
      .collect();
    const sorted = messages.sort(
      (a, b) => a._creationTime - b._creationTime,
    );
    const firstUser = sorted.find((m) => m.role === "user");
    const firstAssistant = sorted.find(
      (m) => m.role === "assistant" && m.content.trim().length > 0,
    );
    return {
      title: chat.title,
      firstUserContent: firstUser?.content ?? "",
      firstAssistantContent: firstAssistant?.content ?? "",
    };
  },
});

export const setGeneratedTitle = internalMutation({
  args: { chatId: v.id("chats"), title: v.string() },
  handler: async (ctx, args) => {
    const cleaned = args.title
      .trim()
      .replace(/^["'`]+|["'`.!?]+$/g, "")
      .replace(/\s+/g, " ")
      .replace(/^(title|chat title|conversation title)\s*[:\-—]\s*/i, "")
      .slice(0, 80);
    if (!cleaned) return null;
    await ctx.db.patch(args.chatId, { title: cleaned });
    return null;
  },
});

export const generateChatTitle = internalAction({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const data: {
      title: string;
      firstUserContent: string;
      firstAssistantContent: string;
    } | null = await ctx.runQuery(internal.chats.getChatForTitle, {
      chatId: args.chatId,
    });
    if (!data) return null;
    if (!data.firstUserContent || !data.firstAssistantContent) return null;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const userSnippet = data.firstUserContent.slice(0, 1500);
    const assistantSnippet = data.firstAssistantContent.slice(0, 800);

    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.OPENROUTER_SITE_URL ?? "https://vercilio.ai",
          "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME ?? "Vercilio",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          stream: false,
          temperature: 0.4,
          max_tokens: 24,
          messages: [
            {
              role: "system",
              content:
                "You generate short titles for chat conversations. Reply with 3-6 words summarizing the topic. Use Title Case. Do not wrap the title in quotes. Do not add a trailing period or any prefix like 'Title:'.",
            },
            {
              role: "user",
              content: `User message:\n${userSnippet}\n\nAssistant reply:\n${assistantSnippet}\n\nWrite the title.`,
            },
          ],
        }),
      });
    } catch {
      return null;
    }

    if (!response.ok) return null;
    const json = await response.json().catch(() => null);
    const title = String(
      json?.choices?.[0]?.message?.content ?? "",
    ).trim();
    if (!title) return null;

    await ctx.runMutation(internal.chats.setGeneratedTitle, {
      chatId: args.chatId,
      title,
    });
    return null;
  },
});

export const remove = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.user_id !== identity.subject) {
      throw new Error("Chat not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chat_id", args.chatId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(args.chatId);
    return null;
  },
});
