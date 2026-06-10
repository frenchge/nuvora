import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "@convex/_generated/api";
import { requireUser, HttpError } from "@/lib/auth";
import { fetchAction, getRequiredConvexToken } from "@/lib/convex-server";
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

    // If Stripe is already in the requested state we skip the write, but we
    // still re-sync Convex below — our local copy may be the thing that's
    // stale (the original bug: cancel succeeded on Stripe, app never updated).
    const current =
      active.cancel_at_period_end === !resume
        ? active
        : await stripe.subscriptions.update(active.id, {
            cancel_at_period_end: !resume,
          });

    // Don't wait on the customer.subscription.updated webhook (which can lag
    // or be misconfigured) — push the new state into Convex now so the billing
    // UI reflects it on the immediate reload. Best-effort: the webhook stays a
    // fallback, so a sync failure here shouldn't fail the request.
    try {
      const token = await getRequiredConvexToken();
      await fetchAction(api.stripe.syncMySubscription, {}, { token });
    } catch (syncError) {
      console.error("[stripe/cancel] direct Convex sync failed", syncError);
    }

    return NextResponse.json({
      cancel_at_period_end: current.cancel_at_period_end,
      current_period_end: current.current_period_end,
    });
  } catch (e) {
    const err = e as HttpError;
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: err.status ?? 500 },
    );
  }
}
