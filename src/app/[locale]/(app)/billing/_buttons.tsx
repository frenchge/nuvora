"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlanName } from "@/lib/types";

async function startCheckout(payload: object) {
  const r = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await r.json();
  if (!r.ok || !data.url) throw new Error(data.error ?? "Could not start checkout");
  window.location.href = data.url;
}

export function CheckoutButton(
  props:
    | { kind: "subscription"; planName: Exclude<PlanName, "free"> }
    | { kind: "addon"; addonKey: string }
) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await startCheckout(
            props.kind === "subscription"
              ? { type: "subscription", plan: props.planName }
              : { type: "addon", addon: props.addonKey }
          );
        } catch (e) {
          alert((e as Error).message);
          setBusy(false);
        }
      }}
    >
      {busy ? "Redirecting…" : props.kind === "subscription" ? "Choose plan" : "Buy"}
    </Button>
  );
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/stripe/portal", { method: "POST" });
          const data = await r.json();
          if (!r.ok || !data.url) throw new Error(data.error ?? "Failed");
          window.location.href = data.url;
        } catch (e) {
          alert((e as Error).message);
          setBusy(false);
        }
      }}
    >
      {busy ? "Opening…" : "Payment methods"}
    </Button>
  );
}

// Cancels the current subscription at period end (the user keeps access
// for the rest of the cycle they paid for). Pass `endsAt` so the confirm
// can quote the actual date the access stops.
export function CancelSubscriptionButton({ endsAt }: { endsAt: number | null }) {
  const [busy, setBusy] = useState(false);

  async function onCancel() {
    const endsLabel = endsAt
      ? new Date(endsAt).toLocaleDateString()
      : "the end of your current billing period";
    const ok = window.confirm(
      `Cancel your subscription? You'll keep access until ${endsLabel}, then drop to the Free plan.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const r = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume: false }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Couldn't cancel right now.");
      // The webhook syncs the cancel_at_period_end flag back. Force a refresh
      // so the badge + button state update on this tab.
      window.location.reload();
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Button
      variant="ghost"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={busy}
      onClick={onCancel}
    >
      {busy ? "Canceling…" : "Cancel subscription"}
    </Button>
  );
}

// Undo a scheduled cancellation — the subscription resumes auto-renewal.
export function ResumeSubscriptionButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/stripe/cancel", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ resume: true }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? "Couldn't resume.");
          window.location.reload();
        } catch (e) {
          alert((e as Error).message);
          setBusy(false);
        }
      }}
    >
      {busy ? "Resuming…" : "Keep subscription"}
    </Button>
  );
}
