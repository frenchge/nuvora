import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser, HttpError } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Toggles `cancel_at_period_end` on the user's active Stripe subscription.
// Default behavior: schedule a cancel at period end (the user keeps access
// for the rest of the cycle they paid for). Pass `{ resume: true }` to undo.
//
// We always derive the subscription from Stripe by listing the customer's
// subscriptions instead of trusting whatever id we have locally — that way
// we operate on what's actually live, even if our copy is stale.
export async function POST(req: NextRequest) {
  try {
    const profile = await requireUser();
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription on this account." },
        { status: 400 },
      );
    }

    let resume = false;
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body === "object" && "resume" in body) {
        resume = Boolean((body as { resume?: unknown }).resume);
      }
    } catch {
      // No body is fine — defaults to cancel.
    }

    const stripe = getStripe();
    let active: Stripe.Subscription | undefined;
    try {
      const list = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "all",
        limit: 10,
      });
      active = list.data.find((sub) =>
        ["active", "trialing", "past_due"].includes(sub.status),
      );
    } catch (e) {
      if (e instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          { error: "Couldn't reach Stripe. Try again in a moment." },
          { status: 502 },
        );
      }
      throw e;
    }

    if (!active) {
      return NextResponse.json(
        { error: "No active subscription to update." },
        { status: 404 },
      );
    }

    if (active.cancel_at_period_end === !resume) {
      // Already in the requested state; no-op.
      return NextResponse.json({
        cancel_at_period_end: active.cancel_at_period_end,
        current_period_end: active.current_period_end,
      });
    }

    const updated = await stripe.subscriptions.update(active.id, {
      cancel_at_period_end: !resume,
    });

    // Stripe will fire customer.subscription.updated → our webhook syncs
    // the row in Convex so the UI reflects the new state on next refresh.
    return NextResponse.json({
      cancel_at_period_end: updated.cancel_at_period_end,
      current_period_end: updated.current_period_end,
    });
  } catch (e) {
    const err = e as HttpError;
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: err.status ?? 500 },
    );
  }
}
