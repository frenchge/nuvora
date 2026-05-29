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
const FRENCH_REGION_CODES = new Set(["be", "bj", "bf", "bi", "cd", "cg", "ch", "ci", "cm", "dj", "dz", "fr", "ga", "gf", "gn", "gp", "ht", "km", "lu", "ma", "mc", "mq", "mu", "nc", "ne", "pf", "pm", "re", "rw", "sc", "sn", "td", "tg", "tn", "vu", "wf", "yt"]);

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

function hasExplicitLocalePrefix(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function isAppLocale(value: string | undefined): value is AppLocale {
  return typeof value === "string" && routing.locales.includes(value as AppLocale);
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
    if (entry.tag === "en" || entry.tag.startsWith("en-")) {
      return "en";
    }
  }

  const country = (req.headers.get("x-vercel-ip-country") ?? "").toLowerCase();
  if (FRENCH_REGION_CODES.has(country)) {
    return "fr";
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

  const hasLocalePrefix = hasExplicitLocalePrefix(path);
  const existingLocaleCookie = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const preferredLocale = getPreferredLocale(req);

  if (!hasLocalePrefix && !existingLocaleCookie && preferredLocale !== routing.defaultLocale) {
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
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
