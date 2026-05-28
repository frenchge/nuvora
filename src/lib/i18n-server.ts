import "server-only";

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE_NAME, normalizeLocale, type AppLocale } from "@/lib/i18n";

export async function getRequestLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);

  const headerStore = await headers();
  const accept = headerStore.get("accept-language") ?? "";
  const candidates = accept
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    return normalizeLocale(candidate);
  }

  return "en";
}
