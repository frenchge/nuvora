/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const PRICE_BASIC = "price_test_basic";
const PRICE_STARTER = "price_test_starter";
const PRICE_PRO = "price_test_pro";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.WEBHOOK_INTERNAL_SECRET = "test-secret";
  process.env.STRIPE_PRICE_BASIC = PRICE_BASIC;
  process.env.STRIPE_PRICE_STARTER = PRICE_STARTER;
  process.env.STRIPE_PRICE_PRO = PRICE_PRO;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeInvoice(opts: {
  invoiceId: string;
  customerId: string;
  priceId: string;
  amountUsdCents: number;
}) {
  return {
    id: opts.invoiceId,
    customer: opts.customerId,
    amount_paid: opts.amountUsdCents,
    currency: "usd",
    lines: { data: [{ price: { id: opts.priceId } }] },
  };
}

function makeSubscription(opts: {
  subId: string;
  customerId: string;
  priceId: string;
  status: string;
}) {
  return {
    id: opts.subId,
    customer: opts.customerId,
    status: opts.status,
    cancel_at_period_end: false,
    current_period_start: 1_700_000_000,
    current_period_end: 1_702_592_000,
    items: { data: [{ price: { id: opts.priceId } }] },
  };
}

async function seedUser(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const userId = "clerk_user_test_1";
    const customerId = "cus_test_1";
    await ctx.db.insert("users_profile", {
      user_id: userId,
      email: "test@example.com",
      plan_name: "free",
      stripe_customer_id: customerId,
      is_admin: false,
    });
    await ctx.db.insert("credits_ledger", {
      user_id: userId,
      amount: 100,
      type: "grant",
      description: "Free plan: signup grant",
    });
    return { userId, customerId };
  });
}

describe("Stripe webhook → plan, credits, contribution", () => {
  test("basic plan invoice grants credits and enqueues a $3 contribution", async () => {
    const t = convexTest(schema, modules);
    const { userId, customerId } = await seedUser(t);

    // Subscription event lands first in the happy path.
    await t.action(api.stripe.processWebhook, {
      secret: "test-secret",
      eventType: "customer.subscription.created",
      payload: makeSubscription({
        subId: "sub_test_1",
        customerId,
        priceId: PRICE_BASIC,
        status: "active",
      }),
    });

    // Invoice event grants credits + enqueues + fulfills the contribution.
    await t.action(api.stripe.processWebhook, {
      secret: "test-secret",
      eventType: "invoice.payment_succeeded",
      payload: makeInvoice({
        invoiceId: "in_test_1",
        customerId,
        priceId: PRICE_BASIC,
        amountUsdCents: 19_00,
      }),
    });

    // Plan flipped to basic.
    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("users_profile")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .unique(),
    );
    expect(profile?.plan_name).toBe("basic");

    // 10,000 credits granted on top of the 100 free signup credits.
    const balance = await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("credits_ledger")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect();
      return rows.reduce((sum, row) => sum + row.amount, 0);
    });
    expect(balance).toBe(10_100);

    // Payment recorded.
    const payments = await t.run(async (ctx) =>
      ctx.db
        .query("payments")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    expect(payments).toHaveLength(1);
    expect(payments[0]).toMatchObject({
      type: "subscription",
      status: "succeeded",
      amount: 19,
      currency: "usd",
    });

    // Contribution event recorded with plan + correct $ amount.
    // basic portfolio: 4 trees @ €0.43 + 1 bottle @ €1.50 = $3.22.
    // status stays "pending" — fulfillment is marked complete manually.
    const contributions = await t.run(async (ctx) =>
      ctx.db
        .query("contribution_events")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    expect(contributions).toHaveLength(1);
    expect(contributions[0]).toMatchObject({
      plan_name: "basic",
      amount_usd: 3.22,
      source_type: "subscription",
      status: "pending",
    });

    // Allocations exist and only span basic-eligible initiatives
    // (mangrove + arbor_day) — no kelp, no plastic on basic.
    const allocations = await t.run(async (ctx) =>
      ctx.db
        .query("contribution_allocations")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    expect(allocations.length).toBeGreaterThan(0);
    const initiatives = new Set(allocations.map((row) => row.initiative_id));
    expect(initiatives.has("mangrove") || initiatives.has("arbor_day")).toBe(
      true,
    );
    expect(initiatives.has("kelp")).toBe(false);
    expect(initiatives.has("plastic")).toBe(false);
    const allocatedUsd = allocations.reduce(
      (sum, row) => sum + row.amount_usd,
      0,
    );
    expect(allocatedUsd).toBeLessThanOrEqual(3.22 + 1e-6);
  });

  test("invoice arriving before subscription event still allocates as basic", async () => {
    // Webhook ordering isn't guaranteed. This is the regression test for the
    // bug where the contribution would fall back to the user's *current*
    // (still 'free') profile if invoice fired before subscription.
    const t = convexTest(schema, modules);
    const { userId, customerId } = await seedUser(t);

    await t.action(api.stripe.processWebhook, {
      secret: "test-secret",
      eventType: "invoice.payment_succeeded",
      payload: makeInvoice({
        invoiceId: "in_test_2",
        customerId,
        priceId: PRICE_PRO,
        amountUsdCents: 69_00,
      }),
    });

    const contributions = await t.run(async (ctx) =>
      ctx.db
        .query("contribution_events")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    expect(contributions).toHaveLength(1);
    // pro portfolio: 24 trees @ €0.43 + 6 bottles @ €1.50 = $19.32.
    expect(contributions[0].amount_usd).toBe(19.32);
    expect(contributions[0].plan_name).toBe("pro");

    const allocations = await t.run(async (ctx) =>
      ctx.db
        .query("contribution_allocations")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    // Pro funds all four initiatives; allocations should reflect that even
    // though the user's profile is still on 'free' at this point.
    const initiatives = new Set(allocations.map((row) => row.initiative_id));
    expect(initiatives.size).toBeGreaterThanOrEqual(2);
    expect(
      initiatives.has("kelp") ||
        initiatives.has("plastic") ||
        initiatives.has("mangrove") ||
        initiatives.has("arbor_day"),
    ).toBe(true);
  });

  test("addon checkout grants credits but does not contribute", async () => {
    const t = convexTest(schema, modules);
    const { userId, customerId } = await seedUser(t);

    await t.action(api.stripe.processWebhook, {
      secret: "test-secret",
      eventType: "checkout.session.completed",
      payload: {
        id: "cs_test_1",
        mode: "payment",
        customer: customerId,
        amount_total: 7_00,
        currency: "usd",
        metadata: { kind: "addon", clerk_user_id: userId, credits: "5000" },
      },
    });

    // Addon credits granted (5,000 + 100 signup).
    const balance = await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("credits_ledger")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect();
      return rows.reduce((sum, row) => sum + row.amount, 0);
    });
    expect(balance).toBe(5_100);

    // No contribution event for add-ons — they're pure credit refills.
    const contributions = await t.run(async (ctx) =>
      ctx.db
        .query("contribution_events")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    expect(contributions).toHaveLength(0);

    // Plan stays free — add-ons don't change it.
    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("users_profile")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .unique(),
    );
    expect(profile?.plan_name).toBe("free");
  });

  test("re-delivering the same invoice does not double-grant credits", async () => {
    const t = convexTest(schema, modules);
    const { userId, customerId } = await seedUser(t);

    const invoice = makeInvoice({
      invoiceId: "in_test_3",
      customerId,
      priceId: PRICE_STARTER,
      amountUsdCents: 39_00,
    });

    for (let i = 0; i < 3; i++) {
      await t.action(api.stripe.processWebhook, {
        secret: "test-secret",
        eventType: "invoice.payment_succeeded",
        payload: invoice,
      });
    }

    const balance = await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("credits_ledger")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect();
      return rows.reduce((sum, row) => sum + row.amount, 0);
    });
    // 100 signup + 20,000 starter grant — granted exactly once.
    expect(balance).toBe(20_100);

    const contributions = await t.run(async (ctx) =>
      ctx.db
        .query("contribution_events")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect(),
    );
    expect(contributions).toHaveLength(1);
    // starter portfolio: 12 trees @ €0.43 + 3 bottles @ €1.50 = $9.66.
    expect(contributions[0].amount_usd).toBe(9.66);
  });
});

