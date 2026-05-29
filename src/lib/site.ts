import { routing, type Locale } from "@/i18n/routing";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function getLocalizedPath(locale: Locale, pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) {
    return normalizedPath;
  }
  return `/${locale}${normalizedPath}`;
}

export function getAbsoluteUrl(locale: Locale, pathname: string): string {
  return `${getSiteUrl()}${getLocalizedPath(locale, pathname)}`;
}

export function getLocaleAlternates(
  pathname: string,
  locales: readonly Locale[] = routing.locales,
  xDefaultLocale: Locale = routing.defaultLocale,
): Record<string, string> {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, getAbsoluteUrl(locale, pathname)]),
  ) as Record<string, string>;

  languages["x-default"] = getAbsoluteUrl(xDefaultLocale, pathname);
  return languages;
}
