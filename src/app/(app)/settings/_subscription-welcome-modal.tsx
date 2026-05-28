"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Leaf, Sparkles, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import { PLAN_DISPLAY } from "@/lib/plans";
import type { PlanName } from "@/lib/types";
import { getInitiativesForPlan } from "@/lib/contribution-portfolio";
import { formatCredits } from "@/lib/utils";

const PLAN_BLURB: Record<PlanName, string> = {
  free: "",
  basic: "your gateway to all our paid AI models with a meaningful environmental footprint.",
  starter: "the sweet spot — premium AI, big monthly impact, priority routing.",
  pro: "everything we offer, the highest limits, and the deepest contribution.",
};

function pluralize(label: string, n: number) {
  return n === 1 ? label : `${label}s`;
}

export function SubscriptionWelcomeModal({
  plan,
  onDismissed,
}: {
  plan: PlanName;
  onDismissed?: () => void;
}) {
  const router = useRouter();
  const clearPendingPlanWelcome = useMutation(api.users.clearPendingPlanWelcome);
  const [open, setOpen] = useState(true);

  const display = PLAN_DISPLAY[plan];
  const initiatives = useMemo(() => getInitiativesForPlan(plan), [plan]);

  // Strip the success/plan params from the URL once dismissed so a refresh
  // doesn't re-show the modal.
  useEffect(() => {
    if (open) return;
    void clearPendingPlanWelcome({});
    onDismissed?.();
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let dirty = false;
    for (const key of ["success", "plan", "session_id"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        dirty = true;
      }
    }
    if (dirty) {
      router.replace(url.pathname + (url.search ? url.search : ""));
    }
  }, [open, router]);

  if (!display || plan === "free") return null;

  const benefitLines = display.features;
  const contributionSummary: string[] = [];
  if (display.trees > 0) {
    contributionSummary.push(
      `${display.trees} ${pluralize("tree", display.trees)} planted every month`,
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-background px-7 pt-9 pb-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-12 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3 w-3" />
                {display.label} plan
              </span>
              <Dialog.Title className="mt-4 text-3xl font-semibold tracking-tight">
                Welcome to {display.label} — thank you.
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
                {PLAN_BLURB[plan]}
              </Dialog.Description>
            </div>
          </div>

          <div className="space-y-6 px-7 py-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/80">
                What you get
              </h3>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium text-foreground">
                      {formatCredits(display.credits)} credits
                    </span>{" "}
                    refreshed every month.
                  </span>
                </li>
                {benefitLines.slice(1).map((line: string) => (
                  <li key={line} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/85">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {contributionSummary.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  <Leaf className="h-4 w-4" />
                  Your monthly contribution
                </div>
                <p className="mt-2 text-sm leading-6 text-foreground/80">
                  Every payment funds restoration work on your behalf.{" "}
                  {contributionSummary.join(", and ")}
                  {contributionSummary.length > 0 ? "." : ""}
                </p>
                {initiatives.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Spread across:{" "}
                    {initiatives.map((i) => i.label).join(" • ")}
                  </p>
                )}
              </div>
            )}

            <p className="text-sm leading-6 text-muted-foreground">
              Thank you for backing a more sustainable web. The planet — and
              the team — appreciate it.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Start exploring
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
