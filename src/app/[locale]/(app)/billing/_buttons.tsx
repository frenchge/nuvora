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
