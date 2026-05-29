import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import {
  fetchMutation,
  fetchQuery,
  getRequiredConvexToken,
} from "@/lib/convex-server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// GDPR / CCPA right-to-erasure. Runs in this order so a failure in any
// step leaves the user in the most-deleted state possible:
//   1. Cancel every active Stripe subscription immediately.
//   2. Wipe all Convex rows owned by the user (chats, messages, billing,
//      contributions, etc.) — also returns the stripe customer id so we
//      can release it from Stripe last.
//   3. Best-effort delete the Stripe customer (anonymizes any retained
//      invoice records to a deleted-customer placeholder).
//   4. Delete the Clerk user — this signs the session out everywhere.
//
// We expect the caller to confirm via a typed "DELETE" string in the
// request body before this endpoint ever runs.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { confirmation?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body — confirmation check below will reject.
  }
  if (typeof body.confirmation !== "string" || body.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'You must send {"confirmation":"DELETE"} to proceed.' },
      { status: 400 },
    );
  }

  const token = await getRequiredConvexToken();
  const stripe = getStripe();

  // 1. Cancel every live Stripe subscription FIRST, while the profile is
  //    still around. If Stripe is unreachable we bail before deleting
  //    anything, so the user can retry without ending up in a half-deleted
  //    state with billing still active.
  const profile = await fetchQuery(api.users.me, {}, { token }).catch(
    () => null,
  );
  const stripeCustomerId = profile?.stripe_customer_id ?? null;

  if (stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 20,
      });
      for (const sub of subs.data) {
        if (["active", "trialing", "past_due"].includes(sub.status)) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    } catch (e) {
      if (e instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          {
            error:
              "We couldn't cancel your billing right now. Please try again in a moment, or contact support@vercilio.ai.",
          },
          { status: 502 },
        );
      }
      throw e;
    }
  }

  // 2. Wipe every Convex row owned by this user.
  try {
    await fetchMutation(api.users.deleteMe, {}, { token });
  } catch (e) {
    console.error("[account/delete] Convex wipe failed", e);
    return NextResponse.json(
      {
        error:
          "Your billing was canceled but we couldn't delete your data. Email support@vercilio.ai and we'll finish it for you.",
      },
      { status: 500 },
    );
  }

  // 3. Release the Stripe customer (anonymizes retained invoice records to
  //    a deleted-customer placeholder). Best-effort.
  if (stripeCustomerId) {
    await stripe.customers.del(stripeCustomerId).catch(() => null);
  }

  // 4. Delete the Clerk user. This invalidates the session everywhere.
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (e) {
    console.error("[account/delete] Clerk deletion failed", e);
    return NextResponse.json(
      {
        error:
          "Your data was deleted but we couldn't remove your sign-in record. Email support@vercilio.ai and we'll finish it for you.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
