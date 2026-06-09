import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
type AppLocale = (typeof routing.locales)[number];

const LOCALE_COOKIE_NAME: string =
  typeof routing.localeCookie === "object"
    ? (routing.localeCookie.name ?? "NEXT_LOCALE")
    : "NEXT_LOCALE";
const REGION_LOCALE_MAP: Record<string, AppLocale> = {
  at: "de",
  ar: "es",
  be: "fr",
  bf: "fr",
  bi: "fr",
  bj: "fr",
  bo: "es",
  br: "pt",
  cd: "fr",
  cg: "fr",
  ch: "fr",
  ci: "fr",
  cm: "fr",
  co: "es",
  cr: "es",
  de: "de",
  dj: "fr",
  dz: "fr",
  ec: "es",
  es: "es",
  fr: "fr",
  ga: "fr",
  gf: "fr",
  gn: "fr",
  gp: "fr",
  gq: "es",
  gt: "es",
  hn: "es",
  ht: "fr",
  it: "it",
  km: "fr",
  li: "de",
  lu: "fr",
  ma: "fr",
  mc: "fr",
  ml: "fr",
  mq: "fr",
  mu: "fr",
  mx: "es",
  nc: "fr",
  ne: "fr",
  ni: "es",
  pa: "es",
  pe: "es",
  pf: "fr",
  pm: "fr",
  pt: "pt",
  py: "es",
  re: "fr",
  rw: "fr",
  sc: "fr",
  sn: "fr",
  sv: "es",
  td: "fr",
  tg: "fr",
  tn: "fr",
  uy: "es",
  va: "it",
  ve: "es",
  vu: "fr",
  wf: "fr",
  yt: "fr",
};

// Matches the locale prefix when present so the auth check can look at the
// underlying app path. /en/chat and /fr/chat both protect /chat.
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

const isProtected = createRouteMatcher([
  "/chat(.*)",
  "/usage(.*)",
  "/trees(.*)",
  "/billing(.*)",
  "/settings(.*)",
  "/admin(.*)",
  "/api/chat(.*)",
  "/api/stripe/checkout(.*)",
  "/api/stripe/portal(.*)",
]);

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/trpc/");
}

// Routes that must stay locale-agnostic — Google fetches them at the exact
// paths configured in Search Console, and prefixing /fr/ would break the
// crawl. Add the canonical sitemap + robots and the SEO helper files Google
// also probes at the root.
function isSeoBypassPath(pathname: string): boolean {
  return (
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json" ||
    pathname === "/site.webmanifest" ||
    pathname === "/icon.png" ||
    pathname === "/favicon.ico"
  );
}

function hasExplicitLocalePrefix(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function isAppLocale(value: string | undefined): value is AppLocale {
  return typeof value === "string" && routing.locales.includes(value as AppLocale);
}

// Search-engine + AI crawlers. Google explicitly recommends against
// auto-redirecting crawlers based on perceived locale: it stops them from
// reaching every localized URL and makes the canonical (unprefixed, English)
// pages look like "Page with redirect" in Search Console. We let bots through
// to the exact URL they requested; hreflang in the sitemap tells them about
// the other locales.
const CRAWLER_UA =
  /(googlebot|google-inspectiontool|storebot-google|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebot|facebookexternalhit|ia_archiver|applebot|petalbot|bytespider|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|anthropic-ai|ccbot|perplexitybot|twitterbot|linkedinbot|telegrambot|whatsapp|discordbot)/i;

function isSearchEngineBot(req: NextRequest): boolean {
  return CRAWLER_UA.test(req.headers.get("user-agent") ?? "");
}

function getPreferredLocale(req: NextRequest): AppLocale {
  const fromCookie = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (isAppLocale(fromCookie)) {
    return fromCookie;
  }

  const acceptLanguage = req.headers.get("accept-language") ?? "";
  const rankedLanguages = acceptLanguage
    .split(",")
    .map((part) => {
      const [tagPart, ...params] = part.trim().split(";");
      const tag = tagPart.toLowerCase();
      const qValue = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      return {
        tag,
        q: qValue ? Number(qValue.slice(2)) : 1,
      };
    })
    .filter((entry) => Number.isFinite(entry.q) && entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const entry of rankedLanguages) {
    if (entry.tag === "fr" || entry.tag.startsWith("fr-")) {
      return "fr";
    }
    if (entry.tag === "es" || entry.tag.startsWith("es-")) {
      return "es";
    }
    if (entry.tag === "de" || entry.tag.startsWith("de-")) {
      return "de";
    }
    if (entry.tag === "it" || entry.tag.startsWith("it-")) {
      return "it";
    }
    if (entry.tag === "pt" || entry.tag.startsWith("pt-")) {
      return "pt";
    }
    if (entry.tag === "en" || entry.tag.startsWith("en-")) {
      return "en";
    }
  }

  const country = (req.headers.get("x-vercel-ip-country") ?? "").toLowerCase();
  const regionLocale = REGION_LOCALE_MAP[country];
  if (regionLocale) {
    return regionLocale;
  }

  return routing.defaultLocale;
}

function setLocaleCookie(response: NextResponse, locale: string) {
  if (typeof routing.localeCookie !== "object") return;

  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: routing.localeCookie.path,
    sameSite: routing.localeCookie.sameSite,
    maxAge: routing.localeCookie.maxAge,
  });
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const path = req.nextUrl.pathname;

  // Auth gate (independent of locale).
  const localelessPath = stripLocale(path);
  const localelessUrl = new URL(localelessPath || "/", req.url);
  const localelessReq = new NextRequest(localelessUrl, req);
  if (isProtected(localelessReq)) {
    await auth.protect();
  }

  // API + tRPC routes are locale-agnostic.
  if (isApiPath(path)) {
    return NextResponse.next();
  }

  // Same for sitemap, robots, and the other root-level SEO endpoints —
  // serving /fr/sitemap.xml would break Search Console's verified URL.
  if (isSeoBypassPath(path)) {
    return NextResponse.next();
  }

  const hasLocalePrefix = hasExplicitLocalePrefix(path);
  const existingLocaleCookie = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const preferredLocale = getPreferredLocale(req);

  if (
    !hasLocalePrefix &&
    !existingLocaleCookie &&
    !isSearchEngineBot(req) &&
    preferredLocale !== routing.defaultLocale
  ) {
    const url = req.nextUrl.clone();
    url.pathname =
      path === "/" ? `/${preferredLocale}` : `/${preferredLocale}${path}`;
    const response = NextResponse.redirect(url);
    setLocaleCookie(response, preferredLocale);
    return response;
  }

  // Hand off to next-intl for locale resolution + rewriting.
  const response = intlMiddleware(req);

  if (!existingLocaleCookie) {
    setLocaleCookie(response, preferredLocale);
  }

  return response;
});

export const config = {
  // The negative-lookahead at the start now also excludes .xml and .txt so
  // /sitemap.xml and /robots.txt are served straight by Next without ever
  // entering the locale-redirect path.
  matcher: [
    "/((?!_next|sitemap\\.xml|robots\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)",
    "/(api|trpc)(.*)",
  ],
};
