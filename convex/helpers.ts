import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { Currency } from "../src/lib/currency";
import {
  DEFAULT_MODELS,
  defaultPlanConfig,
  type DefaultModelConfig,
  type DefaultPlanConfig,
} from "./defaults";

export const PLAN_NAMES = ["free", "basic", "starter", "pro"] as const;
export type PlanName = (typeof PLAN_NAMES)[number];
type AnyCtx = QueryCtx | MutationCtx;
type PlanConfig = Doc<"plans"> | DefaultPlanConfig;
type ModelConfig = Doc<"models"> | DefaultModelConfig;
const MANUAL_ADMIN_EMAILS = new Set(["lahmerselim@gmail.com"]);

function normalizeEmail(value: string | undefined | null) {
  return value?.trim().toLowerCase() ?? null;
}

function getAdminUserIds() {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAdminCandidate(args: { userId: string; email?: string | null }) {
  return (
    getAdminUserIds().includes(args.userId) ||
    (normalizeEmail(args.email) !== null &&
      MANUAL_ADMIN_EMAILS.has(normalizeEmail(args.email)!))
  );
}

export async function requireIdentity(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "unauthenticated",
      message: "Not signed in",
    });
  }
  return identity;
}

export async function getProfile(
  ctx: QueryCtx,
  userId: string,
): Promise<Doc<"users_profile"> | null> {
  return await ctx.db
    .query("users_profile")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .unique();
}

export async function getProfileM(
  ctx: MutationCtx,
  userId: string,
): Promise<Doc<"users_profile"> | null> {
  return await ctx.db
    .query("users_profile")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .unique();
}

export async function getPlanDoc(
  ctx: AnyCtx,
  planName: PlanName,
): Promise<PlanConfig> {
  const plan = await ctx.db
    .query("plans")
    .withIndex("by_name", (q) => q.eq("name", planName))
    .unique();
  if (!plan) {
    return defaultPlanConfig(planName);
  }
  return plan;
}

export async function getModelBySlug(
  ctx: AnyCtx,
  modelId: string,
): Promise<ModelConfig | null> {
  const model = await ctx.db
    .query("models")
    .withIndex("by_model_id", (q) => q.eq("model_id", modelId))
    .unique();
  if (model) {
    return model;
  }
  return DEFAULT_MODELS.find((entry) => entry.model_id === modelId) ?? null;
}

export async function getUserIdByStripeCustomer(
  ctx: AnyCtx,
  stripeCustomerId: string,
): Promise<string | null> {
  const profile = await ctx.db
    .query("users_profile")
    .withIndex("by_stripe_customer", (q) =>
      q.eq("stripe_customer_id", stripeCustomerId),
    )
    .unique();
  return profile?.user_id ?? null;
}

/** Idempotently create a profile + grant the free signup credits. */
export async function ensureProfile(
  ctx: MutationCtx,
  args: {
    userId: string;
    email?: string;
    fullName?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
  },
): Promise<Doc<"users_profile">> {
  const existing = await getProfileM(ctx, args.userId);
  if (existing) {
    const nextIsAdmin = isAdminCandidate(args);
    if (existing.is_admin !== nextIsAdmin && nextIsAdmin) {
      await ctx.db.patch(existing._id, { is_admin: true });
      const updated = await ctx.db.get(existing._id);
      if (updated) {
        return updated;
      }
    }
    return existing;
  }

  const id = await ctx.db.insert("users_profile", {
    user_id: args.userId,
    email: args.email,
    full_name: args.fullName,
    preferred_language: args.preferredLanguage,
    preferred_currency: args.preferredCurrency,
    plan_name: "free",
    is_admin: isAdminCandidate(args),
  });

  // Free monthly grant on signup
  await ctx.db.insert("credits_ledger", {
    user_id: args.userId,
    amount: 100,
    type: "grant",
    description: "Free plan: signup grant",
  });

  const created = await ctx.db.get(id);
  if (!created)
    throw new ConvexError({ code: "internal", message: "profile not created" });
  return created;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db
    .query("users_profile")
    .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
    .unique();
  const ok =
    (profile?.is_admin ?? false) ||
    isAdminCandidate({
      userId: identity.subject,
      email: profile?.email ?? identity.email ?? null,
    });
  if (!ok)
    throw new ConvexError({
      code: "forbidden",
      message: "Admin access required",
    });
  return { identity, profile };
}

export async function sumLedger(
  ctx: QueryCtx,
  userId: string,
): Promise<number> {
  const rows = await ctx.db
    .query("credits_ledger")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  return rows.reduce((s, r) => s + r.amount, 0);
}

export async function sumLedgerM(
  ctx: MutationCtx,
  userId: string,
): Promise<number> {
  const rows = await ctx.db
    .query("credits_ledger")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  return rows.reduce((s, r) => s + r.amount, 0);
}

export async function countUserMessagesToday(
  ctx: AnyCtx,
  userId: string,
): Promise<number> {
  const dayStart = startOfUtcDayMs();
  const rows = await ctx.db
    .query("messages")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  return rows.filter(
    (row) => row.role === "user" && row._creationTime >= dayStart,
  ).length;
}

export async function countUserMessagesSince(
  ctx: AnyCtx,
  userId: string,
  sinceMs: number,
): Promise<number> {
  const rows = await ctx.db
    .query("messages")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  return rows.filter(
    (row) => row.role === "user" && row._creationTime >= sinceMs,
  ).length;
}

export function isActuallyFreeModel(model: ModelConfig): boolean {
  return (
    Number(model.estimated_cost_per_message_usd ?? 0) === 0 &&
    Number(model.credit_cost_per_message ?? 0) === 0
  );
}

/**
 * Next moment the user's credit balance will be topped up.
 * For paid plans this is the active subscription's `current_period_end`.
 * Free users get a one-time grant at signup and have no automatic reset.
 */
export async function getNextCreditsResetMs(
  ctx: AnyCtx,
  userId: string,
): Promise<number | null> {
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  const active = sub
    .filter(
      (row) => row.status === "active" || row.status === "trialing",
    )
    .sort((a, b) => b._creationTime - a._creationTime)[0];
  return active?.current_period_end ?? null;
}

export async function sumMonthlyApiCost(
  ctx: AnyCtx,
  userId: string,
): Promise<number> {
  const monthStart = startOfUtcMonthMs();
  const rows = await ctx.db
    .query("api_usage")
    .withIndex("by_user", (q) => q.eq("user_id", userId))
    .collect();
  return rows
    .filter((row) => row._creationTime >= monthStart)
    .reduce((sum, row) => sum + Number(row.estimated_api_cost ?? 0), 0);
}

/** Start of UTC day, ms epoch. */
export function startOfUtcDayMs(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Start of UTC month, ms epoch. */
export function startOfUtcMonthMs(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

/** Canonical month key, e.g. "2026-05-01". */
export function isoMonth(now = Date.now()): string {
  return new Date(startOfUtcMonthMs(now)).toISOString().slice(0, 10);
}

export function nextMonthIso(now = Date.now()): string {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    .toISOString()
    .slice(0, 10);
}

/** Verify a request from our Next.js server using the shared webhook secret. */
export function requireWebhookSecret(provided: string | undefined): void {
  const expected = process.env.WEBHOOK_INTERNAL_SECRET;
  if (!expected) {
    throw new ConvexError({
      code: "misconfigured",
      message: "WEBHOOK_INTERNAL_SECRET not set in Convex",
    });
  }
  if (provided !== expected) {
    throw new ConvexError({ code: "forbidden", message: "Bad webhook secret" });
  }
}

export function toIso(ms: number | undefined): string | null {
  return typeof ms === "number" ? new Date(ms).toISOString() : null;
}

export function mapProfile(profile: Doc<"users_profile">) {
  const preferredCurrency =
    (profile.preferred_currency as Currency | undefined) ?? null;

  return {
    id: profile._id,
    user_id: profile.user_id,
    full_name: profile.full_name ?? null,
    email: profile.email ?? null,
    preferred_language: profile.preferred_language ?? "en",
    preferred_currency: preferredCurrency,
    plan_name: profile.plan_name as PlanName,
    stripe_customer_id: profile.stripe_customer_id ?? null,
    is_admin: profile.is_admin,
    admin_discount_percent: profile.admin_discount_percent ?? 0,
    admin_discount_note: profile.admin_discount_note ?? null,
    pending_plan_welcome: (profile.pending_plan_welcome as PlanName | undefined) ?? null,
    created_at: new Date(profile._creationTime).toISOString(),
    updated_at: new Date(profile._creationTime).toISOString(),
  };
}

export function mapChat(chat: Doc<"chats">) {
  return {
    id: chat._id,
    user_id: chat.user_id,
    title: chat.title,
    pinned: chat.pinned ?? false,
    created_at: new Date(chat._creationTime).toISOString(),
    updated_at: new Date(chat.last_activity).toISOString(),
  };
}

export function mapMessage(message: Doc<"messages">) {
  return {
    id: message._id,
    chat_id: message.chat_id,
    user_id: message.user_id,
    role: message.role as "user" | "assistant" | "system",
    content: message.content,
    model_id: message.model_id ?? null,
    credits_used: message.credits_used,
    estimated_api_cost: message.estimated_api_cost,
    citations: message.citations ?? null,
    created_at: new Date(message._creationTime).toISOString(),
  };
}

export function mapModel(model: ModelConfig) {
  const notes = model.admin_notes ?? "";
  const desc = (model.context_description ?? "").toLowerCase();
  const mid = model.model_id.toLowerCase();

  // OpenRouter stores supported_parameters as a comma-separated string in admin_notes
  const params = notes.split(/[,\s]+/).map((p) => p.trim().toLowerCase());
  const hasParam = (...names: string[]) =>
    names.some((n) => params.includes(n));

  const supports_reasoning =
    hasParam("reasoning", "include_reasoning") ||
    mid.includes("o1") ||
    mid.includes("o3") ||
    mid.includes("think") ||
    mid.includes("reason") ||
    desc.includes("reasoning");

  const supports_vision =
    model.supports_vision === true ||
    hasParam("image") ||
    desc.includes("vision") ||
    desc.includes("image") ||
    mid.includes("vision") ||
    mid.includes("vl");

  const supports_tools =
    hasParam("tools", "tool_choice", "parallel_tool_calls") ||
    desc.includes("tool") ||
    desc.includes("function calling");

  const supports_web_search =
    hasParam("web_search") || desc.includes("search") || mid.includes("sonar");

  return {
    id: String(model._id),
    model_id: model.model_id,
    display_name: model.display_name,
    provider: model.provider,
    category: model.category as
      | "small"
      | "standard"
      | "advanced"
      | "premium"
      | "elite",
    credit_cost_per_message: model.credit_cost_per_message,
    enabled: model.enabled,
    supports_streaming: model.supports_streaming,
    supports_files: model.supports_files,
    context_description: model.context_description ?? null,
    admin_notes: model.admin_notes ?? null,
    free_plan_allowed: model.free_plan_allowed,
    is_free: isActuallyFreeModel(model),
    estimated_cost_per_message_usd: model.estimated_cost_per_message_usd,
    sort_order: model.sort_order,
    supports_reasoning,
    supports_vision,
    supports_tools,
    supports_web_search,
  };
}

export function mapPayment(payment: Doc<"payments">) {
  return {
    id: payment._id,
    user_id: payment.user_id,
    stripe_payment_id: payment.stripe_payment_id ?? null,
    amount: payment.amount,
    currency: payment.currency,
    type: payment.type,
    status: payment.status,
    description: payment.description ?? null,
    created_at: new Date(payment._creationTime).toISOString(),
  };
}

export function mapSubscription(subscription: Doc<"subscriptions">) {
  return {
    id: subscription._id,
    user_id: subscription.user_id,
    stripe_subscription_id: subscription.stripe_subscription_id,
    plan_name: subscription.plan_name as PlanName,
    status: subscription.status,
    current_period_start: toIso(subscription.current_period_start),
    current_period_end: toIso(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    created_at: new Date(subscription._creationTime).toISOString(),
    updated_at: new Date(subscription._creationTime).toISOString(),
  };
}

export function mapLedgerEntry(entry: Doc<"credits_ledger">) {
  return {
    id: entry._id,
    user_id: entry.user_id,
    amount: entry.amount,
    type: entry.type,
    description: entry.description ?? null,
    related_message_id:
      (entry.related_message_id as Id<"messages"> | undefined) ?? null,
    created_at: new Date(entry._creationTime).toISOString(),
  };
}
