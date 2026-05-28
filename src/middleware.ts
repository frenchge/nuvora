import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

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

  // Hand off to next-intl for locale resolution + rewriting.
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
