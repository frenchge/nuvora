import { defineRouting } from "next-intl/routing";

// Locale routing for the marketing + app surface.
// Adding a new locale is a two-step process:
//   1. Append the code here.
//   2. Add a corresponding messages/<locale>.json dictionary.
export const routing = defineRouting({
  locales: ["en", "fr", "es", "de", "it", "pt"],
  defaultLocale: "en",
  localeCookie: {
    name: "NEXT_LOCALE",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  },
  // The default locale lives at the root: vercilio.com/about (not /en/about).
  // French is exposed as a prefixed path: vercilio.com/fr/about.
  // Search engines see two distinct, indexable URLs per page.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
