import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { PLAN_DISPLAY, PLAN_ORDER } from "../src/lib/plans";
import { requireAdmin, sumLedgerM } from "./helpers";
import type { Doc } from "./_generated/dataModel";
import type { PlanName } from "../src/lib/types";
import { getPlanContributionUsd } from "../src/lib/contribution-portfolio";

function unitsForDisplay(row: Doc<"contribution_allocations">) {
  return row.status === "fulfilled" || row.status === "completed"
    ? row.units_delivered
    : row.units_requested;
}

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [profiles, subscriptions, allocations, events, ledger] =
      await Promise.all([
        ctx.db.query("users_profile").collect(),
        ctx.db.query("subscriptions").collect(),
        ctx.db.query("contribution_allocations").collect(),
        ctx.db.query("contribution_events").collect(),
        ctx.db.query("credits_ledger").collect(),
      ]);

    const allocationsByContribution = new Map<
      string,
      Doc<"contribution_allocations">[]
    >();
    const allocationsByUser = new Map<string, Doc<"contribution_allocations">[]>();
    for (const allocation of allocations) {
      const key = String(allocation.contribution_event_id);
      const existing = allocationsByContribution.get(key) ?? [];
      existing.push(allocation);
      allocationsByContribution.set(key, existing);

      const userRows = allocationsByUser.get(allocation.user_id) ?? [];
      userRows.push(allocation);
      allocationsByUser.set(allocation.user_id, userRows);
    }

    const eventsByUser = new Map<string, Doc<"contribution_events">[]>();
    for (const event of events) {
      const existing = eventsByUser.get(event.user_id) ?? [];
      existing.push(event);
      eventsByUser.set(event.user_id, existing);
    }

    const latestSubscriptionByUser = new Map<string, Doc<"subscriptions">>();
    for (const subscription of subscriptions) {
      const current = latestSubscriptionByUser.get(subscription.user_id);
      if (!current || subscription._creationTime > current._creationTime) {
        latestSubscriptionByUser.set(subscription.user_id, subscription);
      }
    }

    const creditsByUser = new Map<string, number>();
    for (const row of ledger) {
      creditsByUser.set(row.user_id, (creditsByUser.get(row.user_id) ?? 0) + row.amount);
    }

    const users = profiles
      .map((profile) => {
        const userEvents = eventsByUser.get(profile.user_id) ?? [];
        const userAllocations = allocationsByUser.get(profile.user_id) ?? [];
        const trees = userAllocations
          .filter((allocation) => allocation.api_kind === "trees")
          .reduce((sum, allocation) => sum + unitsForDisplay(allocation), 0);
        const bottles = userAllocations
          .filter((allocation) => allocation.api_kind === "plastic")
          .reduce((sum, allocation) => sum + unitsForDisplay(allocation), 0);
        const pendingCount = userEvents.filter((event) => event.status === "pending").length;
        const fulfilledCount = userEvents.filter(
          (event) => event.status === "fulfilled" || event.status === "completed",
        ).length;
        const latestSubscription = latestSubscriptionByUser.get(profile.user_id);

        return {
          id: String(profile._id),
          userId: profile.user_id,
          email: profile.email ?? "",
          fullName: profile.full_name ?? "",
          planName: profile.plan_name,
          isAdmin: profile.is_admin,
          discountPercent: profile.admin_discount_percent ?? 0,
          discountNote: profile.admin_discount_note ?? "",
          creditsBalance: creditsByUser.get(profile.user_id) ?? 0,
          subscriptionStatus: latestSubscription?.status ?? null,
          trees,
          bottles,
          pendingCount,
          fulfilledCount,
          createdAt: new Date(profile._creationTime).toISOString(),
        };
      })
      .sort((a, b) => {
        if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
        if (a.planName !== b.planName) {
          return PLAN_ORDER.indexOf(b.planName as PlanName) - PLAN_ORDER.indexOf(a.planName as PlanName);
        }
        return a.email.localeCompare(b.email);
      });

    const contributions = events
      .map((event) => {
        const eventAllocations =
          allocationsByContribution.get(String(event._id)) ?? [];
        const profile = profiles.find((row) => row.user_id === event.user_id);
        return {
          id: String(event._id),
          userId: event.user_id,
          email: profile?.email ?? "",
          fullName: profile?.full_name ?? "",
          planName: event.plan_name ?? profile?.plan_name ?? "free",
          status: event.status,
          trees: eventAllocations
            .filter((allocation) => allocation.api_kind === "trees")
            .reduce((sum, allocation) => sum + unitsForDisplay(allocation), 0),
          bottles: eventAllocations
            .filter((allocation) => allocation.api_kind === "plastic")
            .reduce((sum, allocation) => sum + unitsForDisplay(allocation), 0),
          sourceType: event.source_type,
          createdAt: new Date(event._creationTime).toISOString(),
          fulfilledAt:
            typeof event.fulfilled_at === "number"
              ? new Date(event.fulfilled_at).toISOString()
              : null,
          note: event.fulfilled_note ?? "",
        };
      })
      .sort((a, b) => {
        const aPending = a.status === "pending";
        const bPending = b.status === "pending";
        if (aPending !== bPending) return aPending ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      });

    return { users, contributions, plans: PLAN_ORDER.map((plan) => PLAN_DISPLAY[plan]) };
  },
});

export const setUserDiscount = mutation({
  args: {
    userId: v.string(),
    discountPercent: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .unique();
    if (!profile) {
      throw new Error("User not found");
    }

    const normalizedPercent = Math.max(0, Math.min(100, Math.round(args.discountPercent)));
    await ctx.db.patch(profile._id, {
      admin_discount_percent: normalizedPercent,
      admin_discount_note: args.note?.trim() || undefined,
    });
    return null;
  },
});

export const setUserAdminRole = mutation({
  args: {
    userId: v.string(),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .unique();
    if (!profile) {
      throw new Error("User not found");
    }
    await ctx.db.patch(profile._id, { is_admin: args.isAdmin });
    return null;
  },
});

export const setUserPlan = mutation({
  args: {
    userId: v.string(),
    planName: v.union(
      v.literal("free"),
      v.literal("basic"),
      v.literal("starter"),
      v.literal("pro"),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .unique();
    if (!profile) {
      throw new Error("User not found");
    }

    await ctx.db.patch(profile._id, { plan_name: args.planName });

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();
    const latest = subscriptions.sort((a, b) => b._creationTime - a._creationTime)[0] ?? null;
    const now = Date.now();
    const nextMonth = now + 30 * 24 * 60 * 60 * 1000;

    if (args.planName === "free") {
      if (latest) {
        await ctx.db.patch(latest._id, {
          plan_name: "free",
          status: "canceled",
          current_period_end: now,
          cancel_at_period_end: true,
        });
      }
      await ctx.db.patch(profile._id, {
        pending_plan_welcome: undefined,
      });
      return { creditsBalance: await sumLedgerM(ctx, args.userId) };
    }

    const plan = PLAN_DISPLAY[args.planName];
    await ctx.db.insert("credits_ledger", {
      user_id: args.userId,
      amount: plan.credits,
      type: "admin_adjust",
      description: `${plan.label} plan applied by admin`,
    });

    if (latest) {
      await ctx.db.patch(latest._id, {
        plan_name: args.planName,
        status: "active",
        current_period_start: now,
        current_period_end: nextMonth,
        cancel_at_period_end: false,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        user_id: args.userId,
        stripe_subscription_id: `admin_${args.planName}_${now}`,
        plan_name: args.planName,
        status: "active",
        current_period_start: now,
        current_period_end: nextMonth,
        cancel_at_period_end: false,
      });
    }

    const paymentId = await ctx.db.insert("payments", {
      user_id: args.userId,
      amount: plan.price,
      currency: "eur",
      type: "subscription",
      status: "admin_applied",
      description: `${plan.label} plan applied by admin`,
    });

    await ctx.runMutation(internal.contributions.enqueueContribution, {
      userId: args.userId,
      paymentId,
      amount: plan.price,
      currency: "eur",
      sourceType: "subscription",
      contributionUsd: getPlanContributionUsd(args.planName),
      planName: args.planName,
    });

    await ctx.db.patch(profile._id, {
      pending_plan_welcome: args.planName,
    });

    return { creditsBalance: await sumLedgerM(ctx, args.userId) };
  },
});

export const markContributionFulfilled = mutation({
  args: {
    contributionId: v.id("contribution_events"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, profile } = await requireAdmin(ctx);
    const contribution = await ctx.db.get(args.contributionId);
    if (!contribution) {
      throw new Error("Contribution not found");
    }

    const allocations = await ctx.db
      .query("contribution_allocations")
      .withIndex("by_contribution", (q) =>
        q.eq("contribution_event_id", args.contributionId),
      )
      .collect();

    const now = Date.now();
    for (const allocation of allocations) {
      await ctx.db.patch(allocation._id, {
        status: "fulfilled",
        units_delivered: allocation.units_requested,
        fulfilled_at: now,
        error_message: undefined,
      });
    }

    await ctx.db.patch(contribution._id, {
      status: "fulfilled",
      fulfilled_at: now,
      fulfilled_by: profile?.email ?? identity.email ?? identity.subject,
      fulfilled_note: args.note?.trim() || undefined,
      error_message: undefined,
    });

    return null;
  },
});
