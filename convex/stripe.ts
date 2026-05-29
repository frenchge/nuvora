import { v } from "convex/values";
import {
  action,
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import Stripe from "stripe";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  getProfile,
  getUserIdByStripeCustomer,
  mapPayment,
  mapSubscription,
  requireIdentity,
  requireWebhookSecret,
} from "./helpers";
import {
  addonEnvPriceVar,
  CREDIT_ADDONS,
  PLAN_DISPLAY,
  PLAN_ORDER,
  getPlanContributionUsd,
  planEnvPriceVar,
} from "../src/lib/plans";
import { CURRENCIES } from "../src/lib/currency";
import type { PlanName } from "../src/lib/types";

function planForPriceId(priceId: string | undefined): PlanName | null {
  if (!priceId) return null;

  for (const plan of ["basic", "starter", "pro"] as const) {
    for (const currency of CURRENCIES) {
      const envVar = planEnvPriceVar(plan, currency);
      if (envVar && process.env[envVar] === priceId) {
        return plan;
      }
    }
  }

  return null;
}

function addonCreditsForPriceId(priceId: string | undefined): number | null {
  const addon = CREDIT_ADDONS.find((row) =>
    CURRENCIES.some(
      (currency) => process.env[addonEnvPriceVar(row.envVar, currency)] === priceId,
    ),
  );
  return addon?.credits ?? null;
}

function isPaidPlan(value: string | null | undefined): value is Exclude<PlanName, "free"> {
  return value === "basic" || value === "starter" || value === "pro";
}

function isActiveSubscriptionStatus(status: string) {
  return status === "active" || status === "trialing" || status === "past_due";
}

async function upsertProfileAndSubscription(
  ctx: MutationCtx,
  {
    userId,
    customerId,
    subscriptionId,
    plan,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  }: {
    userId: string;
    customerId: string;
    subscriptionId: string | null;
    plan: Exclude<PlanName, "free">;
    status: string;
    currentPeriodStart: number | null;
    currentPeriodEnd: number | null;
    cancelAtPeriodEnd: boolean;
  },
) {
  if (subscriptionId) {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_id", (q) => q.eq("stripe_subscription_id", subscriptionId))
      .unique();

    const nextData = {
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      plan_name: plan,
      status,
      current_period_start: currentPeriodStart ?? undefined,
      current_period_end: currentPeriodEnd ?? undefined,
      cancel_at_period_end: cancelAtPeriodEnd,
    };
    const cleanNextData = Object.fromEntries(
      Object.entries(nextData).filter(([, value]) => value !== undefined),
    );

    if (existing) {
      await ctx.db.patch(existing._id, cleanNextData);
    } else {
      await ctx.db.insert("subscriptions", cleanNextData as typeof nextData);
    }
  }

  const profile = await ctx.db
    .query("users_profile")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .unique();
  if (!profile) {
    return null;
  }

  // Subscription became healthy again? Clear any failed-payment grace.
  const planNext = isActiveSubscriptionStatus(status) ? plan : "free";
  const clearGrace =
    (status === "active" || status === "trialing") && profile.payment_grace_until
      ? { payment_grace_until: undefined }
      : {};
  await ctx.db.patch(profile._id, {
    plan_name: planNext,
    stripe_customer_id: customerId,
    ...clearGrace,
  });

  return profile._id;
}

export const setStripeCustomerId = mutation({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .unique();
    if (!profile) {
      throw new Error("Profile not found");
    }
    await ctx.db.patch(profile._id, { stripe_customer_id: args.stripeCustomerId });
    return args.stripeCustomerId;
  },
});

export const getBillingPageData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    if (!profile) {
      throw new Error("Profile not found");
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
      .collect();
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
      .collect();

    const currentSubscription = subscriptions
      .sort((a, b) => b._creationTime - a._creationTime)[0];

    return {
      profile: {
        stripe_customer_id: profile.stripe_customer_id ?? null,
        plan_name: profile.plan_name,
      },
      subscription: currentSubscription ? mapSubscription(currentSubscription) : null,
      payments: payments
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 20)
        .map(mapPayment),
      plans: PLAN_ORDER.map((name) => PLAN_DISPLAY[name]),
      addons: CREDIT_ADDONS,
    };
  },
});

export const debugUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("users_profile")
      .collect();
    const profile = profiles.find((p) => p.email?.toLowerCase() === args.email.toLowerCase());
    
    if (!profile) {
      return { error: "User not found" };
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", profile.user_id))
      .collect();
    
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("user_id", profile.user_id))
      .collect();

    const credits = await ctx.db
      .query("credits_ledger")
      .collect();
    const userCredits = credits.filter((c) => c.user_id === profile.user_id);

    return {
      profile,
      subscriptions: subscriptions.sort((a, b) => b._creationTime - a._creationTime),
      payments: payments.sort((a, b) => b._creationTime - a._creationTime),
      creditsLedger: userCredits.sort((a, b) => b._creationTime - a._creationTime),
      totalCredits: userCredits.reduce((sum, c) => sum + c.amount, 0),
    };
  },
});

export const manualSyncBasicPlan = internalMutation({
  args: { email: v.string(), planName: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("users_profile")
      .collect();
    const profile = profiles.find((p) => p.email?.toLowerCase() === args.email.toLowerCase());
    
    if (!profile) {
      return { error: "User not found" };
    }

    const plan = args.planName as PlanName;
    const planDisplay = PLAN_DISPLAY[plan];
    
    if (!planDisplay) {
      return { error: `Invalid plan: ${plan}` };
    }

    // Update profile to the new plan
    await ctx.db.patch(profile._id, { plan_name: plan });

    // Grant the plan credits
    await ctx.db.insert("credits_ledger", {
      user_id: profile.user_id,
      amount: planDisplay.credits,
      type: "grant",
      description: `${plan} plan: manual sync (upgrade from free)`,
    });

    // Create a dummy subscription record (so it shows as "on a plan")
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", profile.user_id))
      .unique();

    if (!existingSubscription) {
      await ctx.db.insert("subscriptions", {
        user_id: profile.user_id,
        stripe_subscription_id: `manual_${plan}_${Date.now()}`,
        plan_name: plan,
        status: "active",
        current_period_start: Date.now(),
        current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
        cancel_at_period_end: false,
      });
    }

    return {
      success: true,
      message: `Synced ${profile.email} to ${plan} plan with ${planDisplay.credits} credits`,
      profile: await ctx.db.get(profile._id),
    };
  },
});

export const processWebhook = action({
  args: {
    secret: v.string(),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    requireWebhookSecret(args.secret);

    switch (args.eventType) {
      case "checkout.session.completed":
        if (args.payload?.mode === "payment" && args.payload?.metadata?.kind === "addon") {
          const result = await ctx.runMutation(internal.stripe.recordAddonCheckout, {
            sessionId: String(args.payload.id),
            customerId: typeof args.payload.customer === "string" ? args.payload.customer : null,
            clerkUserId: args.payload.metadata?.clerk_user_id ?? null,
            amount: Number(args.payload.amount_total ?? 0) / 100,
            currency: String(args.payload.currency ?? "usd"),
            credits: Number(args.payload.metadata?.credits ?? 0),
          });
        }
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await ctx.runMutation(internal.stripe.applySubscriptionStatus, {
          subscription: args.payload,
        });
        break;
      case "invoice.payment_succeeded":
        {
          const result = await ctx.runMutation(internal.stripe.recordInvoicePaid, {
          invoice: args.payload,
        });
        }
        break;
      case "invoice.payment_failed":
        await ctx.runMutation(internal.stripe.recordInvoiceFailed, {
          invoice: args.payload,
        });
        break;
      default:
        break;
    }

    return { received: true };
  },
});

export const syncCheckoutSession = action({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const profile = await ctx.runQuery(api.users.me, {});
    if (!profile) {
      throw new Error("Profile not found");
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    const stripe = new Stripe(key, {
      apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
    });

    const session = await stripe.checkout.sessions.retrieve(args.sessionId, {
      expand: ["subscription", "invoice"],
    });
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

    if (!customerId) {
      throw new Error("Checkout session is missing a customer.");
    }
    if (
      session.metadata?.clerk_user_id &&
      session.metadata.clerk_user_id !== identity.subject
    ) {
      throw new Error("This checkout session does not belong to the current user.");
    }
    if (
      profile.stripe_customer_id &&
      profile.stripe_customer_id !== customerId &&
      session.metadata?.clerk_user_id !== identity.subject
    ) {
      throw new Error("This checkout session does not match the current account.");
    }

    if (session.mode !== "subscription") {
      return { synced: false, reason: "not_subscription" };
    }

    const subscription =
      session.subscription && typeof session.subscription !== "string"
        ? (session.subscription as Stripe.Subscription)
        : null;
    const invoice =
      session.invoice && typeof session.invoice !== "string"
        ? (session.invoice as Stripe.Invoice)
        : null;

    const priceId =
      session.metadata?.plan
        ? process.env[
            session.metadata.plan === "basic"
              ? "STRIPE_PRICE_BASIC"
              : session.metadata.plan === "starter"
                ? "STRIPE_PRICE_STARTER"
                : "STRIPE_PRICE_PRO"
          ]
        : subscription?.items.data[0]?.price?.id;
    const plan = isPaidPlan(session.metadata?.plan)
      ? session.metadata.plan
      : planForPriceId(priceId);
    if (!isPaidPlan(plan)) {
      throw new Error("Could not determine the selected plan.");
    }

    const result = await ctx.runMutation(internal.stripe.applyCheckoutSessionSync, {
      userId: identity.subject,
      customerId,
      subscriptionId: subscription?.id ?? null,
      invoiceId: invoice?.id ?? null,
      plan,
      amount: Number(invoice?.amount_paid ?? session.amount_total ?? 0) / 100,
      currency: String(invoice?.currency ?? session.currency ?? "usd"),
      status: subscription?.status ?? "active",
      currentPeriodStart: subscription?.current_period_start
        ? Number(subscription.current_period_start) * 1000
        : null,
      currentPeriodEnd: subscription?.current_period_end
        ? Number(subscription.current_period_end) * 1000
        : null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    });

    return { synced: true, plan };
  },
});

export const applyCheckoutSessionSync = internalMutation({
  args: {
    userId: v.string(),
    customerId: v.string(),
    subscriptionId: v.union(v.string(), v.null()),
    invoiceId: v.union(v.string(), v.null()),
    plan: v.union(v.literal("basic"), v.literal("starter"), v.literal("pro")),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    currentPeriodStart: v.union(v.number(), v.null()),
    currentPeriodEnd: v.union(v.number(), v.null()),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ contributionId: Id<"contribution_events"> | null }> => {
    await upsertProfileAndSubscription(ctx, {
      userId: args.userId,
      customerId: args.customerId,
      subscriptionId: args.subscriptionId,
      plan: args.plan,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
    });

    // Flag the profile so the global welcome modal pops up — even if the user
    // never lands on the success URL (e.g. closed the tab after paying), the
    // webhook-driven path below will eventually trigger this same flag.
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, { pending_plan_welcome: args.plan });
    }

    if (!args.invoiceId) {
      return { contributionId: null };
    }

    const invoiceId = args.invoiceId;
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_stripe_id", (q) => q.eq("stripe_payment_id", invoiceId))
      .unique();
    if (existing) {
      return { contributionId: null };
    }

    const planDisplay = PLAN_DISPLAY[args.plan];
    await ctx.db.insert("credits_ledger", {
      user_id: args.userId,
      amount: planDisplay.credits,
      type: "grant",
      description: `${args.plan} plan: monthly credits`,
    });

    const paymentId = await ctx.db.insert("payments", {
      user_id: args.userId,
      stripe_payment_id: args.invoiceId,
      amount: args.amount,
      currency: args.currency,
      type: "subscription",
      status: "succeeded",
      description: `${args.plan} plan invoice`,
    });

    const contributionId: Id<"contribution_events"> | null = await ctx.runMutation(
      internal.contributions.enqueueContribution,
      {
        userId: args.userId,
        paymentId,
        stripePaymentId: invoiceId,
        amount: args.amount,
        currency: args.currency,
        sourceType: "subscription",
        contributionUsd: getPlanContributionUsd(args.plan),
      },
    );

    return { contributionId };
  },
});

export const applySubscriptionStatus = internalMutation({
  args: { subscription: v.any() },
  handler: async (ctx, args) => {
    const sub = args.subscription;
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (!customerId) {
      return null;
    }

    const userId = await getUserIdByStripeCustomer(ctx, customerId);
    if (!userId) {
      return null;
    }

    const priceId = sub.items?.data?.[0]?.price?.id;
    const plan = planForPriceId(priceId) ?? "free";

    if (plan !== "free") {
      // Detect a fresh activation (was on free / different plan) so we can
      // pop the welcome modal even if the user never lands on success URL.
      const priorProfile = await ctx.db
        .query("users_profile")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .unique();
      const wasUpgrade =
        priorProfile && priorProfile.plan_name !== plan && isActiveSubscriptionStatus(String(sub.status));

      await upsertProfileAndSubscription(ctx, {
        userId,
        customerId,
        subscriptionId: String(sub.id),
        plan,
        status: String(sub.status),
        currentPeriodStart: sub.current_period_start
          ? Number(sub.current_period_start) * 1000
          : null,
        currentPeriodEnd: sub.current_period_end
          ? Number(sub.current_period_end) * 1000
          : null,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      });

      if (wasUpgrade) {
        const profile = await ctx.db
          .query("users_profile")
          .withIndex("by_user_id", (q) => q.eq("user_id", userId))
          .unique();
        if (profile) {
          await ctx.db.patch(profile._id, { pending_plan_welcome: plan });
        }
      }
    } else {
      const profile = await ctx.db
        .query("users_profile")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .unique();
      if (profile) {
        await ctx.db.patch(profile._id, {
          plan_name: "free",
          stripe_customer_id: customerId,
        });
      }
    }
    return null;
  },
});

export const recordAddonCheckout = internalMutation({
  args: {
    sessionId: v.string(),
    customerId: v.union(v.string(), v.null()),
    clerkUserId: v.union(v.string(), v.null()),
    amount: v.number(),
    currency: v.string(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_stripe_id", (q) => q.eq("stripe_payment_id", args.sessionId))
      .unique();
    if (existing) {
      // Add-ons are pure credit purchases; the user's OpenRouter spend
      // and our keep margin already account for the cost, so nothing
      // flows to restoration partners on add-on payments.
      return { paymentId: existing._id, contributionId: null };
    }

    const userId =
      args.clerkUserId ??
      (args.customerId ? await getUserIdByStripeCustomer(ctx, args.customerId) : null);
    if (!userId) {
      return null;
    }

    if (args.credits > 0) {
      await ctx.db.insert("credits_ledger", {
        user_id: userId,
        amount: args.credits,
        type: "addon",
        description: `Add-on: ${args.credits} credits`,
      });
    }

    const paymentId = await ctx.db.insert("payments", {
      user_id: userId,
      stripe_payment_id: args.sessionId,
      amount: args.amount,
      currency: args.currency,
      type: "addon",
      status: "succeeded",
      description: `Credit add-on: +${args.credits.toLocaleString()} credits`,
    });
    return { paymentId, contributionId: null };
  },
});

type InvoiceResult = {
  paymentId: Id<"payments">;
  contributionId: Id<"contribution_events"> | null;
} | null;

export const recordInvoicePaid = internalMutation({
  args: { invoice: v.any() },
  handler: async (ctx, args): Promise<InvoiceResult> => {
    const invoice = args.invoice;
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_stripe_id", (q) => q.eq("stripe_payment_id", String(invoice.id)))
      .unique();
    if (existing) {
      if (existing.type !== "subscription") {
        return { paymentId: existing._id, contributionId: null };
      }
      const profile = await ctx.db
        .query("users_profile")
        .withIndex("by_user_id", (q) => q.eq("user_id", existing.user_id))
        .unique();
      const planName = (profile?.plan_name ?? "free") as PlanName;
      const contributionUsd = getPlanContributionUsd(planName);
      const contributionId: Id<"contribution_events"> | null = await ctx.runMutation(
        internal.contributions.enqueueContribution,
        {
          userId: existing.user_id,
          paymentId: existing._id,
          stripePaymentId: String(invoice.id),
          amount: existing.amount,
          currency: existing.currency,
          sourceType: existing.type,
          contributionUsd,
          planName,
        }
      );
      return { paymentId: existing._id, contributionId };
    }

    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) {
      return null;
    }

    const userId = await getUserIdByStripeCustomer(ctx, customerId);
    if (!userId) {
      return null;
    }

    const priceId = invoice.lines?.data?.[0]?.price?.id;
    const plan = planForPriceId(priceId);
    const addonCredits = addonCreditsForPriceId(priceId);
    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? null;
    const period = invoice.lines?.data?.[0]?.period;

    if (isPaidPlan(plan)) {
      await upsertProfileAndSubscription(ctx, {
        userId,
        customerId,
        subscriptionId,
        plan,
        status: "active",
        currentPeriodStart: period?.start ? Number(period.start) * 1000 : null,
        currentPeriodEnd: period?.end ? Number(period.end) * 1000 : null,
        cancelAtPeriodEnd: false,
      });
    }

    if (isPaidPlan(plan)) {
      const planDisplay = PLAN_DISPLAY[plan];
      await ctx.db.insert("credits_ledger", {
        user_id: userId,
        amount: planDisplay.credits,
        type: "grant",
        description: `${plan} plan: monthly credits`,
      });
    }

    if (addonCredits) {
      await ctx.db.insert("credits_ledger", {
        user_id: userId,
        amount: addonCredits,
        type: "addon",
        description: `Add-on: ${addonCredits} credits`,
      });
    }

    const paymentId = await ctx.db.insert("payments", {
      user_id: userId,
      stripe_payment_id: String(invoice.id),
      amount: Number(invoice.amount_paid ?? 0) / 100,
      currency: String(invoice.currency ?? "usd"),
      type: plan ? "subscription" : "addon",
      status: "succeeded",
      description: plan ? `${plan} plan invoice` : "Invoice payment",
    });
    if (!plan) {
      return { paymentId, contributionId: null };
    }
    const contributionId: Id<"contribution_events"> | null = await ctx.runMutation(
      internal.contributions.enqueueContribution,
      {
        userId,
        paymentId,
        stripePaymentId: String(invoice.id),
        amount: Number(invoice.amount_paid ?? 0) / 100,
        currency: String(invoice.currency ?? "usd"),
        sourceType: "subscription",
        contributionUsd: getPlanContributionUsd(plan),
        planName: plan,
      }
    );
    return { paymentId, contributionId };
  },
});

const PAYMENT_GRACE_MS = 24 * 60 * 60 * 1000;

export const recordInvoiceFailed = internalMutation({
  args: { invoice: v.any() },
  handler: async (ctx, args) => {
    const invoice = args.invoice;
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_stripe_id", (q) => q.eq("stripe_payment_id", String(invoice.id)))
      .unique();
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) {
      return null;
    }
    const userId = await getUserIdByStripeCustomer(ctx, customerId);
    if (!userId) {
      return null;
    }

    if (!existing) {
      await ctx.db.insert("payments", {
        user_id: userId,
        stripe_payment_id: String(invoice.id),
        amount: Number(invoice.amount_due ?? 0) / 100,
        currency: String(invoice.currency ?? "usd"),
        type: "subscription",
        status: "failed",
        description: "Payment failed",
      });
    }

    // Start a 24h grace window for paid users so they have time to fix
    // their card before being downgraded to free. Skip if already on free.
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .unique();
    if (profile && profile.plan_name !== "free") {
      const graceUntil = Date.now() + PAYMENT_GRACE_MS;
      await ctx.db.patch(profile._id, { payment_grace_until: graceUntil });
      await ctx.scheduler.runAfter(
        PAYMENT_GRACE_MS,
        internal.stripe.processPaymentGraceExpiry,
        { userId },
      );
    }

    return null;
  },
});

/**
 * Fires 24h after a failed payment. If the grace deadline is still in the
 * past (i.e. no successful retry came in to clear it) and the user is still
 * on a paid plan, downgrade them to free. If the user has already been
 * brought back to good standing, this no-ops.
 */
export const processPaymentGraceExpiry = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("users_profile")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
      .unique();
    if (!profile) return null;
    if (!profile.payment_grace_until) return null;
    if (profile.payment_grace_until > Date.now()) return null;
    if (profile.plan_name === "free") {
      await ctx.db.patch(profile._id, { payment_grace_until: undefined });
      return null;
    }
    await ctx.db.patch(profile._id, {
      plan_name: "free",
      payment_grace_until: undefined,
    });
    return null;
  },
});
