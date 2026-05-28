import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { api } from "@convex/_generated/api";
import { fetchAction } from "@/lib/convex-server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
// Stripe needs the raw body
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${(e as Error).message}` },
      { status: 400 }
    );
  }

  try {
    await fetchAction(api.stripe.processWebhook, {
      secret: process.env.WEBHOOK_INTERNAL_SECRET ?? "",
      eventType: event.type,
      payload: event.data.object,
    });
  } catch (e) {
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
