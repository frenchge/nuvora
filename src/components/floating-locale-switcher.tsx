"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Locale display metadata. Adding a locale means:
//   1. Append it to routing.locales.
//   2. Add an entry here.
//   3. Drop messages/<locale>.json.
const LOCALE_META: Record<
  (typeof routing.locales)[number],
  { label: string; flag: string }
> = {
  en: { label: "English", flag: "🇺🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
};
const LOCALE_COOKIE_NAME =
  typeof routing.localeCookie === "object"
    ? routing.localeCookie.name
    : "NEXT_LOCALE";

export function FloatingLocaleSwitcher() {
  const locale = useLocale() as keyof typeof LOCALE_META;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: (typeof routing.locales)[number]) {
    setOpen(false);
    if (next === locale) return;
    startTransition(() => {
      document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.replace(pathname, { locale: next });
    });
  }

  const current = LOCALE_META[locale] ?? LOCALE_META.en;
  const others = routing.locales.filter(
    (code) => code !== locale,
  ) as (keyof typeof LOCALE_META)[];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 print:hidden"
    >
      {open &&
        others.map((code) => {
          const meta = LOCALE_META[code];
          return (
            <button
              key={code}
              type="button"
              onClick={() => switchTo(code)}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent hover:text-foreground"
            >
              <span aria-hidden className="text-lg leading-none">
                {meta.flag}
              </span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      <button
        type="button"
        aria-label="Change language"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent",
          pending && "opacity-60",
        )}
      >
        <span aria-hidden className="text-lg leading-none">
          {current.flag}
        </span>
        <span>{current.label}</span>
        {open && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}
