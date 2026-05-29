"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";

// Floating Upgrade pill shown only to users on the free plan. Lives next to
// the app-shell's theme toggle (which sits at the top-right corner) and
// links straight to the Billing tab in Settings. Hidden once the user is on
// any paid plan.
//
// Mounts in AppShell, so it only ever renders inside the signed-in app
// surface — never on marketing routes.
export function UpgradeBadge({ className }: { className?: string }) {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  if (!profile) return null;
  if (profile.plan_name && profile.plan_name !== "free") return null;

  return (
    <Link
      href="/settings?tab=billing"
      className={cn(
        "fixed right-4 top-3 z-50 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Upgrade
    </Link>
  );
}
