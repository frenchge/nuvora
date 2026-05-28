import { query } from "./_generated/server";
import {
  type PlanName,
  countUserMessagesToday,
  getNextCreditsResetMs,
  getPlanDoc,
  getProfile,
  mapLedgerEntry,
  requireIdentity,
  startOfUtcMonthMs,
  sumLedger,
  sumMonthlyApiCost,
} from "./helpers";

export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await sumLedger(ctx, identity.subject);
  },
});

export const getCreditsStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const [balance, profile, resetMs] = await Promise.all([
      sumLedger(ctx, identity.subject),
      getProfile(ctx, identity.subject),
      getNextCreditsResetMs(ctx, identity.subject),
    ]);
    const grace = profile?.payment_grace_until ?? null;
    return {
      balance,
      planName: (profile?.plan_name ?? "free") as PlanName,
      nextResetAt: resetMs ? new Date(resetMs).toISOString() : null,
      paymentGraceUntil:
        grace && grace > Date.now() ? new Date(grace).toISOString() : null,
    };
  },
});

export const getUsageOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const [balance, messagesToday, monthlyApiCost] = await Promise.all([
      sumLedger(ctx, identity.subject),
      countUserMessagesToday(ctx, identity.subject),
      sumMonthlyApiCost(ctx, identity.subject),
    ]);

    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .unique();
    if (!profile) {
      throw new Error("Profile not found");
    }

    const plan = await getPlanDoc(ctx, profile.plan_name as PlanName);
    const monthStart = startOfUtcMonthMs();
    const deductions = await ctx.db
      .query("credits_ledger")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
      .collect();
    const ledger = deductions
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 20)
      .map(mapLedgerEntry);

    const usedThisMonth = deductions
      .filter((row) => row.type === "deduction" && row._creationTime >= monthStart)
      .reduce((sum, row) => sum + Math.abs(row.amount), 0);

    return {
      balance,
      messagesToday,
      monthlyApiCost,
      usedThisMonth,
      monthlyCredits: plan.monthly_credits,
      dailyMessageLimit: plan.daily_message_limit,
      maxMessageLength: plan.max_message_length,
      ledger,
      planName: profile.plan_name,
    };
  },
});
