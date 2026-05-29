import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { FloatingLocaleSwitcher } from "@/components/floating-locale-switcher";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Google Analytics 4 measurement ID. Server-rendered into a Script tag so the
// gtag.js loader and the `config` call ship on every locale's pages.
const GA_MEASUREMENT_ID = "G-YSJ69KZKK9";

export const metadata: Metadata = {
  title: "Vercilio — The best AI, with real impact built in.",
  description:
    "Use the best AI models in one calm app, and let your paid usage help fund verified tree planting through our partners.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <ClerkProvider>
      <html
        lang={locale}
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="min-h-screen bg-background font-sans">
          <NextIntlClientProvider>
            <ConvexClientProvider>
              <ThemeProvider>
                {children}
                <FloatingLocaleSwitcher />
              </ThemeProvider>
            </ConvexClientProvider>
          </NextIntlClientProvider>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
