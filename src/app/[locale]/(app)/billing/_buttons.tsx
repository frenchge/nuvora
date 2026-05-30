"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full space-y-2">
      <Button
        className="w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await startCheckout(
              props.kind === "subscription"
                ? { type: "subscription", plan: props.planName }
                : { type: "addon", addon: props.addonKey }
            );
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Redirecting…" : props.kind === "subscription" ? "Choose plan" : "Buy"}
      </Button>
      {error && (
        <p className="text-sm leading-5 text-destructive">
          {error}
        </p>
      )}
    </div>
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  async function onCancel() {
    setBusy(true);
    setError(null);
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
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const endsLabel = endsAt
    ? new Date(endsAt).toLocaleDateString()
    : "the end of your current billing period";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
        >
          Cancel subscription
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <div className="border-b border-border/50 bg-[linear-gradient(180deg,rgba(255,174,61,0.12),rgba(255,174,61,0))] px-6 py-5 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-semibold tracking-tight">
                    Cancel your subscription
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                    You&apos;ll keep full access until {endsLabel}. After that, your
                    account will move back to the Free plan unless you resume before
                    the billing period ends.
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="space-y-5 px-6 py-6 md:px-7">
            <div className="rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm leading-6 text-foreground/80">
              Your chats and account stay intact. This only stops renewal at the end
              of the current cycle.
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" className="min-w-32 rounded-xl" disabled={busy}>
                  Keep subscription
                </Button>
              </Dialog.Close>
              <Button
                variant="destructive"
                className="min-w-40 rounded-xl"
                disabled={busy}
                onClick={onCancel}
              >
                {busy ? "Canceling…" : "Confirm cancellation"}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
