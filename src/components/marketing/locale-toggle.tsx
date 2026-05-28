"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Compact EN | FR toggle. Lives in the marketing nav so a French visitor
// can flip languages without typing /fr/ themselves. Uses next-intl's
// locale-aware router so the *same* path swaps locales (e.g.
// /pricing <-> /fr/pricing).
export function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (next === locale) return;
    startTransition(() => {
      // `pathname` from next-intl/navigation is already locale-stripped, so
      // we just hand it back with the new locale.
      router.replace(pathname, { locale: next as (typeof routing.locales)[number] });
    });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/40 p-0.5 text-[11px] font-medium uppercase tracking-wide",
        pending && "opacity-60",
        className,
      )}
    >
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          aria-pressed={locale === code}
          className={cn(
            "rounded-full px-2 py-0.5 transition-colors",
            locale === code
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
