import { defineRouting } from "next-intl/routing";

// Locale routing for the marketing + app surface.
// Adding a new locale is a two-step process:
//   1. Append the code here.
//   2. Add a corresponding messages/<locale>.json dictionary.
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  // The default locale lives at the root: vercilio.com/about (not /en/about).
  // French is exposed as a prefixed path: vercilio.com/fr/about.
  // Search engines see two distinct, indexable URLs per page.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
