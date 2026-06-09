import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site";

// Authenticated app sections + auth screens. These either redirect to
// /sign-in for Googlebot (showing up as "Page with redirect" in Search
// Console) or are private — none should ever be crawled or indexed, so we
// keep them out of the crawl budget entirely.
const PRIVATE_PATHS = [
  "chat",
  "settings",
  "billing",
  "usage",
  "admin",
  "trees",
  "contribution",
  "sign-in",
  "sign-up",
] as const;

// Build a disallow entry for the default-locale path (e.g. /chat) plus every
// prefixed-locale variant (e.g. /fr/chat) since robots.txt path matching does
// not understand our locale prefixes.
function disallowedPaths(): string[] {
  const prefixedLocales = routing.locales.filter(
    (locale) => locale !== routing.defaultLocale,
  );
  const paths = PRIVATE_PATHS.flatMap((path) => [
    `/${path}`,
    ...prefixedLocales.map((locale) => `/${locale}/${path}`),
  ]);
  // API/tRPC endpoints are never indexable content.
  paths.push("/api/");
  return paths;
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallowedPaths(),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: new URL(siteUrl).host,
  };
}
