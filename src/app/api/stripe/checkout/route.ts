import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { api } from "@convex/_generated/api";
import { requireUser, HttpError } from "@/lib/auth";
import { fetchMutation, getRequiredConvexToken } from "@/lib/convex-server";
import { getStripe } from "@/lib/stripe";
import { CREDIT_ADDONS, planEnvPriceVar } from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Validate a Stripe price ID env var.
 *
 * Real Stripe Price IDs always start with `price_` and are otherwise opaque
 * tokens of varying length, so we don't enforce a strict regex (the previous
 * version rejected legitimate IDs). Anything matching the prefix passes
 * through; if it's actually wrong, Stripe will reject it and we surface
 * Stripe's error to the caller.
 *
 * Returns the value on success, or a *specific* reason string on failure
 * so the user can diagnose without grep'ing server logs.
 */
type PriceCheck = { ok: true; value: string } | { ok: false; reason: string };

function readPriceEnv(envVar: string): PriceCheck {
  const raw = process.env[envVar];
  if (raw === undefined) {
    return {
      ok: false,
      reason:
        `${envVar} is not set. Add it to .env.local, then fully stop ` +
        `\`npm run dev\` (Ctrl+C) and restart — Next.js only reads .env.local at startup.`,
    };
  }
  const v = raw.trim();
  if (v === "") {
    return { ok: false, reason: `${envVar} is empty in .env.local.` };
  }
  // Common placeholders we ship in .env.example.
  if (v === "price_xxx" || v.startsWith("REPLACE_ME") || v === "price_") {
    return {
      ok: false,
      reason:
        `${envVar} is still the placeholder ("${v}"). Paste a real price ID ` +
        `from https://dashboard.stripe.com/test/prices.`,
    };
  }
  if (!v.startsWith("price_")) {
    const preview = v.length > 28 ? v.slice(0, 28) + "…" : v;
    return {
      ok: false,
      reason:
        `${envVar}="${preview}" doesn't look like a Stripe Price ID. ` +
        `IDs always start with "price_" — make sure you didn't paste a ` +
        `Product ID ("prod_…") or a price amount.`,
    };
  }
  return { ok: true, value: v };
}

function missingPriceResponse(check: Extract<PriceCheck, { ok: false }>) {
  return NextResponse.json({ error: check.reason }, { status: 500 });
}

const Body = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("subscription"),
    plan: z.enum(["basic", "starter", "pro"]),
  }),
  z.object({
    type: z.literal("addon"),
    addon: z.string().min(1),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const profile = await requireUser();
    const body = Body.parse(await req.json());
    const stripe = getStripe();
    const token = await getRequiredConvexToken();

    // Ensure a Stripe customer exists.
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email ?? undefined,
        name: profile.full_name ?? undefined,
        metadata: { clerk_user_id: profile.user_id },
      });
      customerId = customer.id;
      await fetchMutation(
        api.stripe.setStripeCustomerId,
        { stripeCustomerId: customerId },
        { token }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const adminDiscountPercent = Math.max(
      0,
      Math.min(100, Math.round(profile.admin_discount_percent ?? 0)),
    );

    let priceId: string | undefined;
    let mode: "subscription" | "payment";
    let metadata: Record<string, string>;

    if (body.type === "subscription") {
      const envVar = planEnvPriceVar(body.plan)!;
      const check = readPriceEnv(envVar);
      if (!check.ok) return missingPriceResponse(check);
      priceId = check.value;
      mode = "subscription";
      metadata = {
        clerk_user_id: profile.user_id,
        kind: "subscription",
        plan: body.plan,
      };
    } else {
      const addon = CREDIT_ADDONS.find((a) => a.key === body.addon);
      if (!addon) return NextResponse.json({ error: "Unknown add-on" }, { status: 400 });
      const check = readPriceEnv(addon.envVar);
      if (!check.ok) return missingPriceResponse(check);
      priceId = check.value;
      mode = "payment";
      metadata = {
        clerk_user_id: profile.user_id,
        kind: "addon",
        addon: addon.key,
        credits: String(addon.credits),
      };
    }

    const successUrl =
      body.type === "subscription"
        ? `${appUrl}/settings?tab=billing&success=1&plan=${body.plan}&session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}/settings?tab=billing&success=1&session_id={CHECKOUT_SESSION_ID}`;

    let session;
    try {
      const discounts =
        adminDiscountPercent > 0
          ? [
              {
                coupon: (
                  await stripe.coupons.create({
                    percent_off: adminDiscountPercent,
                    duration: mode === "subscription" ? "forever" : "once",
                    name: `Vercilio admin discount (${adminDiscountPercent}% off)`,
                    metadata: {
                      clerk_user_id: profile.user_id,
                      source: "vercilio_admin_discount",
                    },
                  })
                ).id,
              },
            ]
          : undefined;

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: `${appUrl}/settings?tab=billing&canceled=1`,
        allow_promotion_codes: true,
        ...(discounts ? { discounts } : {}),
        metadata,
        ...(mode === "subscription" ? { subscription_data: { metadata } } : {}),
      });
    } catch (e) {
      if (e instanceof Stripe.errors.StripeError) {
        // Surface a friendly message to the user; the underlying Stripe
        // error is logged server-side for diagnostics only.
        console.error("[checkout] payment provider rejected", {
          priceId,
          message: e.message,
        });
        return NextResponse.json(
          {
            error:
              "We couldn't start the checkout. Please try again or contact support if the problem persists.",
          },
          { status: 400 }
        );
      }
      throw e;
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const err = e as HttpError;
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: err.status ?? 500 }
    );
  }
}
