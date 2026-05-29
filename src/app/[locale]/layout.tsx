import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { FloatingCurrencySwitcher } from "@/components/floating-currency-switcher";
import { FloatingLocaleSwitcher } from "@/components/floating-locale-switcher";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { routing, type Locale } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "../globals.css";

// Google Analytics 4 measurement ID. Server-rendered into a Script tag so the
// gtag.js loader and the `config` call ship on every locale's pages.
const GA_MEASUREMENT_ID = "G-YSJ69KZKK9";

export const metadata: Metadata = {
  title: {
    default: "Vercilio — The AI platform that plants trees.",
    template: "%s · Vercilio",
  },
  description:
    "Chat with the world's leading AI models in one workspace, and fund verified reforestation with every paid subscription.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: "Vercilio",
  authors: [{ name: "Vercilio" }],
  generator: "Next.js",
  keywords: [
    "AI",
    "chatbot",
    "GPT",
    "Claude",
    "Gemini",
    "AI subscription",
    "reforestation",
    "tree planting",
    "environmental impact",
    "OpenRouter",
  ],
  openGraph: {
    type: "website",
    siteName: "Vercilio",
    images: [`${getSiteUrl()}/verciliologoblack.png`],
  },
  twitter: {
    card: "summary_large_image",
    site: "@vercilio_ai",
    creator: "@vercilio_ai",
  },
  icons: {
    icon: "/icon.png",
  },
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
  const messages = await getMessages();

  const typedLocale = locale as Locale;
  return (
    <ClerkProvider>
      <html
        lang={locale}
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <head>
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://clerk.vercilio.com" />
        </head>
        <body className="min-h-screen bg-background font-sans">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProvider>
              {children}
              <FloatingCurrencySwitcher />
              <FloatingLocaleSwitcher />
            </ThemeProvider>
          </NextIntlClientProvider>
          <JsonLd data={organizationJsonLd()} />
          <JsonLd data={websiteJsonLd(typedLocale)} />
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="ga-init" strategy="lazyOnload">
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
