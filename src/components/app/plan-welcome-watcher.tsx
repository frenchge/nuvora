"use client";

import { useEffect, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { PlanName } from "@/lib/types";
import { SubscriptionWelcomeModal } from "@/app/[locale]/(app)/settings/_subscription-welcome-modal";

const PLAN_KEYS: PlanName[] = ["free", "basic", "starter", "pro"];

function isPaidPlan(value: string | null | undefined): value is Exclude<PlanName, "free"> {
  return value === "basic" || value === "starter" || value === "pro";
}

/**
 * Watches the current user's profile for a `pending_plan_welcome` signal and
 * pops the welcome modal anywhere in the app. The signal is set by:
 *   - Stripe checkout sync (post-payment return URL)
 *   - Stripe subscription.created webhook (covers users who close the tab)
 *   - Admin "set plan" action (parity with Stripe path)
 *
 * Reactivity is driven by Convex, so the modal shows up live without a route
 * change — the recipient of an admin-applied plan sees it instantly.
 */
export function PlanWelcomeWatcher() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const pending = profile?.pending_plan_welcome ?? null;
  const [activePlan, setActivePlan] = useState<Exclude<PlanName, "free"> | null>(null);

  useEffect(() => {
    if (!pending) return;
    if (!PLAN_KEYS.includes(pending as PlanName)) return;
    if (!isPaidPlan(pending)) return;
    setActivePlan(pending);
  }, [pending]);

  if (!activePlan) return null;
  return (
    <SubscriptionWelcomeModal
      key={activePlan}
      plan={activePlan}
      onDismissed={() => setActivePlan(null)}
    />
  );
}
