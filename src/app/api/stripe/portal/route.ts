import { NextResponse } from "next/server";
import { requireUser, HttpError } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  try {
    const profile = await requireUser();
    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account yet" }, { status: 400 });
    }
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const err = e as HttpError;
    return NextResponse.json(
      { error: err.message ?? "Server error" },
      { status: err.status ?? 500 }
    );
  }
}
