import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ensureProfile,
  getProfile,
  getProfileM,
  mapProfile,
  requireIdentity,
} from "./helpers";

const MANUAL_ADMIN_EMAILS = new Set(["lahmerselim@gmail.com"]);
const currencyValidator = v.union(
  v.literal("USD"),
  v.literal("EUR"),
  v.literal("GBP"),
);

function shouldBeAdmin(userId: string, email?: string | null) {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  return (
    adminIds.includes(userId) ||
    (normalizedEmail !== null && MANUAL_ADMIN_EMAILS.has(normalizedEmail))
  );
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    return profile ? mapProfile(profile) : null;
  },
});

export const ensureCurrentUser = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await ensureProfile(ctx, {
      userId: identity.subject,
      email: args.email,
      fullName: args.fullName,
      preferredLanguage: args.preferredLanguage,
    });
    return mapProfile(profile);
  },
});

export const syncCurrentUserIdentity = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await getProfileM(ctx, identity.subject);

    if (!existing) {
      const created = await ensureProfile(ctx, {
        userId: identity.subject,
        email: args.email,
        fullName: args.fullName,
        preferredLanguage: args.preferredLanguage,
      });
      return mapProfile(created);
    }

    const nextEmail = args.email ?? existing.email;
    const nextFullName = args.fullName ?? existing.full_name;
    const nextPreferredLanguage =
      args.preferredLanguage ?? existing.preferred_language;
    const nextIsAdmin = shouldBeAdmin(identity.subject, nextEmail);

    if (
      nextEmail !== existing.email ||
      nextFullName !== existing.full_name ||
      nextPreferredLanguage !== existing.preferred_language ||
      nextIsAdmin !== existing.is_admin
    ) {
      await ctx.db.patch(existing._id, {
        email: nextEmail,
        full_name: nextFullName,
        preferred_language: nextPreferredLanguage,
        is_admin: nextIsAdmin,
      });
    }

    const updated = await getProfileM(ctx, identity.subject);
    if (!updated) {
      throw new Error("Profile not found after sync");
    }
    return mapProfile(updated);
  },
});

// GDPR / CCPA right-to-erasure. Wipes every row this user owns across the
// app's tables in a single mutation, then deletes the profile itself.
//
// Tables touched (all are user-scoped):
//   users_profile, chats, messages, credits_ledger, contribution_events,
//   contribution_allocations, payments, subscriptions, api_usage
//
// The caller (API route on the Next side) is responsible for canceling
// Stripe subscriptions and deleting the Clerk user — Convex doesn't know
// about either system. We return whether a profile actually existed and
// the stripe customer id so the caller can decide what to do next.
export const deleteMe = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const userId = identity.subject;

    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .unique();

    const stripeCustomerId = profile?.stripe_customer_id ?? null;

    // Each table is queried by its own by_user* index, then rows are
    // collect → delete'd. Account deletion is rare and bounded by one user's
    // history, so a single-batch walk is fine.
    async function deleteAll(rows: { _id: import("./_generated/dataModel").Id<"chats"> | import("./_generated/dataModel").Id<"messages"> | import("./_generated/dataModel").Id<"credits_ledger"> | import("./_generated/dataModel").Id<"contribution_events"> | import("./_generated/dataModel").Id<"contribution_allocations"> | import("./_generated/dataModel").Id<"payments"> | import("./_generated/dataModel").Id<"subscriptions"> | import("./_generated/dataModel").Id<"api_usage"> }[]) {
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
      return rows.length;
    }

    const counts = {
      chats: await deleteAll(
        await ctx.db
          .query("chats")
          .withIndex("by_user_activity", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      messages: await deleteAll(
        await ctx.db
          .query("messages")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      credits_ledger: await deleteAll(
        await ctx.db
          .query("credits_ledger")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      contribution_events: await deleteAll(
        await ctx.db
          .query("contribution_events")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      contribution_allocations: await deleteAll(
        await ctx.db
          .query("contribution_allocations")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      payments: await deleteAll(
        await ctx.db
          .query("payments")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      subscriptions: await deleteAll(
        await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
      api_usage: await deleteAll(
        await ctx.db
          .query("api_usage")
          .withIndex("by_user", (q) => q.eq("user_id", userId))
          .collect(),
      ),
    };

    if (profile) {
      await ctx.db.delete(profile._id);
    }

    return {
      profileDeleted: profile !== null,
      stripeCustomerId,
      ...counts,
    };
  },
});

export const clearPendingPlanWelcome = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existing = await getProfileM(ctx, identity.subject);
    if (!existing || !existing.pending_plan_welcome) {
      return null;
    }
    await ctx.db.patch(existing._id, {
      pending_plan_welcome: undefined,
    });
    return null;
  },
});

export const setPreferredCurrency = mutation({
  args: { currency: currencyValidator },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await getProfileM(ctx, identity.subject);
    if (!existing) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(existing._id, {
      preferred_currency: args.currency,
    });

    const updated = await getProfileM(ctx, identity.subject);
    if (!updated) {
      throw new Error("Profile not found after currency update");
    }
    return mapProfile(updated);
  },
});
