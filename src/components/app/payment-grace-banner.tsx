"use client";

import { useEffect, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Link } from "@/i18n/navigation";

const DISMISSED_KEY = "vercilio.paymentGraceBanner.dismissedUntil";

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
}

export function PaymentGraceBanner() {
  const { isAuthenticated } = useConvexAuth();
  const status = useQuery(
    api.credits.getCreditsStatus,
    isAuthenticated ? {} : "skip",
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISSED_KEY);
      if (!raw) return;
      const until = Number(raw);
      if (Number.isFinite(until) && until > Date.now()) {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const graceIso = status?.paymentGraceUntil;
  if (!graceIso || dismissed) return null;

  const hours = hoursUntil(graceIso);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm shadow-lg backdrop-blur-md">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 leading-5 text-amber-900 dark:text-amber-100">
          <span className="font-semibold">
            Your last payment didn&apos;t go through.
          </span>{" "}
          Update your payment method within {hours}{" "}
          {hours === 1 ? "hour" : "hours"} to keep your plan — otherwise
          you&apos;ll be moved back to the free tier.{" "}
          <Link
            href="/settings?tab=billing"
            className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-50"
          >
            Update billing →
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            // Dismiss until the grace window ends — the banner will reappear
            // automatically if a new failure starts a fresh grace period.
            try {
              window.localStorage.setItem(
                DISMISSED_KEY,
                String(new Date(graceIso).getTime()),
              );
            } catch {
              // ignore
            }
            setDismissed(true);
          }}
          className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-700/80 transition-colors hover:bg-amber-500/20 hover:text-amber-900 dark:text-amber-300/80 dark:hover:text-amber-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
