import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getRequestLocale } from "@/lib/i18n-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercilio — The best AI, with real impact built in.",
  description:
    "Use the best AI models in one calm app, and let your paid usage help fund verified tree planting through our partners.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <ClerkProvider>
      <html
        lang={locale}
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="min-h-screen bg-background font-sans">
          <ConvexClientProvider>
            <ThemeProvider>
              <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
