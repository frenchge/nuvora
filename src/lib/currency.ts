/**
 * Currency selection.
 *
 * We support three display + billing currencies: USD, EUR, and GBP.
 * Numeric values are kept identical across currencies — i.e. $19 ≡ €19 — so
 * we don't need a live FX rate. This is the same model Notion / Linear use.
 *
 * Resolution order:
 *   1. Explicit user preference stored on `users_profile.currency`
 *   2. `x-vercel-ip-country` / `cf-ipcountry` (geo-IP from the edge)
 *   3. `Accept-Language` country tag (e.g. `en-US`, `de-DE`)
 *   4. Fallback: EUR
 *
 * Each currency maps to its own Stripe Price ID per plan/add-on.
 */

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "EUR";
export const CURRENCY_COOKIE_NAME = "NEXT_CURRENCY";

const USD_COUNTRIES = new Set(["US", "PR", "GU", "VI", "AS", "MP"]);
const GBP_COUNTRIES = new Set(["GB", "IM", "GG", "JE"]);

const EUR_COUNTRIES = new Set([
  // Eurozone
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
  // Other EU members not in the eurozone — still bill in EUR by default
  // (Stripe will FX, the customer expects euro pricing anyway).
  "BG", "CZ", "DK", "HU", "PL", "RO", "SE",
  // EUR-using non-EU
  "AD", "MC", "VA", "SM", "XK", "ME",
]);

/** Lower-cased two-letter language tag → currency, for Accept-Language heuristic. */
const LANG_TO_CURRENCY: Record<string, Currency> = {
  // Languages where the speaker is overwhelmingly in the eurozone:
  de: "EUR", fr: "EUR", it: "EUR", nl: "EUR", el: "EUR",
  fi: "EUR", sv: "EUR", da: "EUR", pl: "EUR", cs: "EUR",
  sk: "EUR", sl: "EUR", lt: "EUR", lv: "EUR", et: "EUR",
  hr: "EUR", hu: "EUR", ro: "EUR", bg: "EUR",
  pt: "EUR",
  es: "EUR",
};

export function detectCurrencyFromHeaders(headers: Headers): Currency {
  const country = (
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code") ??
    ""
  ).toUpperCase();
  if (country && USD_COUNTRIES.has(country)) return "USD";
  if (country && GBP_COUNTRIES.has(country)) return "GBP";
  if (country && EUR_COUNTRIES.has(country)) return "EUR";

  const accept = headers.get("accept-language") ?? "";
  // Take the first weighted preference: e.g. "de-DE,de;q=0.9,en;q=0.5"
  const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!primary) return DEFAULT_CURRENCY;

  const [lang, region] = primary.split("-");
  if (region && USD_COUNTRIES.has(region.toUpperCase())) return "USD";
  if (region && GBP_COUNTRIES.has(region.toUpperCase())) return "GBP";
  if (region && EUR_COUNTRIES.has(region.toUpperCase())) return "EUR";
  if (lang && LANG_TO_CURRENCY[lang] === "EUR") return "EUR";
  return DEFAULT_CURRENCY;
}

export function resolveCurrencyPreference({
  cookieValue,
  headers,
  preferredCurrency,
}: {
  cookieValue?: string | null;
  headers?: Headers;
  preferredCurrency?: string | null;
}): Currency {
  if (preferredCurrency && isCurrency(preferredCurrency)) {
    return preferredCurrency;
  }
  if (cookieValue && isCurrency(cookieValue)) {
    return cookieValue;
  }
  if (headers) {
    return detectCurrencyFromHeaders(headers);
  }
  return DEFAULT_CURRENCY;
}

export function isCurrency(v: unknown): v is Currency {
  return typeof v === "string" && (CURRENCIES as readonly string[]).includes(v);
}

export function normalizeCurrency(v: unknown): Currency {
  return isCurrency(v) ? v : DEFAULT_CURRENCY;
}

export function currencySymbol(c: Currency): string {
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return "$";
}

/** Locale we hand to Intl for grouping and decimal style per currency. */
export function localeFor(c: Currency): string {
  if (c === "EUR") return "en-IE";
  if (c === "GBP") return "en-GB";
  return "en-US";
}
