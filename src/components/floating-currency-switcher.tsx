"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname as useRawPathname } from "next/navigation";
import {
  CURRENCIES,
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  detectCurrencyFromNavigator,
  currencySymbol,
  isCurrency,
  type Currency,
} from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";

const CURRENCY_META: Record<
  Currency,
  { code: string; label: string; symbol: string }
> = {
  USD: { code: "USD", label: "US dollar", symbol: "$" },
  EUR: { code: "EUR", label: "Euro", symbol: "€" },
  GBP: { code: "GBP", label: "British pound", symbol: "£" },
};

function resolveClientCurrency(): Currency {
  if (typeof document !== "undefined") {
    const cookieValue = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${CURRENCY_COOKIE_NAME}=`))
      ?.split("=")[1];
    if (cookieValue && isCurrency(cookieValue)) {
      return cookieValue;
    }
  }

  if (typeof navigator !== "undefined") {
    const preferredLanguage = navigator.languages?.[0] ?? navigator.language;
    return detectCurrencyFromNavigator(preferredLanguage);
  }

  return DEFAULT_CURRENCY;
}

export function FloatingCurrencySwitcher() {
  const router = useRouter();
  const rawPathname = useRawPathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(DEFAULT_CURRENCY);
  const containerRef = useRef<HTMLDivElement>(null);

  const pathnameWithoutLocale = rawPathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const isAppRoute = [
    "/admin",
    "/billing",
    "/chat",
    "/contribution",
    "/settings",
    "/trees",
    "/usage",
  ].some((prefix) =>
    pathnameWithoutLocale === prefix || pathnameWithoutLocale.startsWith(`${prefix}/`),
  );

  if (isAppRoute) {
    return null;
  }

  useEffect(() => {
    setSelectedCurrency(resolveClientCurrency());
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function writeCurrencyCookie(currency: Currency) {
    document.cookie = `${CURRENCY_COOKIE_NAME}=${currency}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  function switchCurrency(nextCurrency: Currency) {
    setOpen(false);
    if (nextCurrency === selectedCurrency) return;

    startTransition(() => {
      writeCurrencyCookie(nextCurrency);
      setSelectedCurrency(nextCurrency);
      router.refresh();
    });
  }

  const current = CURRENCY_META[selectedCurrency];
  const options = CURRENCIES.filter((currency) => currency !== selectedCurrency);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[3.75rem] right-5 z-50 flex flex-col items-end gap-2 print:hidden"
    >
      {open &&
        options.map((currency) => {
          const meta = CURRENCY_META[currency];
          return (
            <button
              key={currency}
              type="button"
              onClick={() => switchCurrency(currency)}
              className="flex items-center gap-3 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="text-base font-semibold leading-none text-primary">
                {meta.symbol}
              </span>
              <span>{meta.code}</span>
            </button>
          );
        })}
      <button
        type="button"
        aria-label="Change currency"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent",
          pending && "opacity-60",
        )}
      >
        <span className="text-base font-semibold leading-none text-primary">
          {currencySymbol(selectedCurrency)}
        </span>
        <span>{current.code}</span>
      </button>
    </div>
  );
}
