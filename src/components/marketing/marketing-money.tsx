"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  detectCurrencyFromNavigator,
  isCurrency,
  type Currency,
} from "@/lib/currency";
import { formatMoney } from "@/lib/utils";

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

export function MarketingMoney({
  amount,
  precision = 2,
}: {
  amount: number;
  precision?: number;
}) {
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    setCurrency(resolveClientCurrency());
  }, []);

  return (
    <span suppressHydrationWarning>
      {formatMoney(amount, currency, { precision })}
    </span>
  );
}

export function MarketingPerMonthText({
  amount,
  precision = 0,
}: {
  amount: number;
  precision?: number;
}) {
  const t = useTranslations("Pricing");
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    setCurrency(resolveClientCurrency());
  }, []);

  return (
    <span suppressHydrationWarning>
      {t("values.perMonth", {
        value: formatMoney(amount, currency, { precision }),
      })}
    </span>
  );
}
