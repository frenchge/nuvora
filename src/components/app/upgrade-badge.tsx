"use client";

import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Floating Upgrade pill shown only to users on the free plan. Lives next to
// the app-shell's theme toggle (which sits at the top-right corner) and
// links straight to the Billing tab in Settings. Hidden once the user is on
// any paid plan.
//
// Mounts in AppShell, which decides whether the pill should render.
export function UpgradeBadge({ className }: { className?: string }) {
  return (
    <Link
      href="/settings?tab=billing"
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90",
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Upgrade
    </Link>
  );
}
