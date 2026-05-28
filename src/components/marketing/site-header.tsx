"use client";

import { useEffect, useState } from "react";
import { usePathname as useRawPathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Bot, CircleHelp, Coins, House, Leaf } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function SiteHeader() {
  const rawPathname = useRawPathname();
  const { resolvedTheme } = useTheme();
  const t = useTranslations("Nav");
  const [heroTone, setHeroTone] = useState(false);

  // Use the raw (locale-prefixed) pathname here because we just need to know
  // if we're sitting on the marketing root for the hero-tone styling.
  const isHome = rawPathname === "/" || /^\/[a-z]{2}\/?$/.test(rawPathname);

  useEffect(() => {
    const updateTone = () => {
      if (!isHome || resolvedTheme === "dark") {
        setHeroTone(false);
        return;
      }
      setHeroTone(window.scrollY < 620);
    };

    updateTone();
    window.addEventListener("scroll", updateTone, { passive: true });
    window.addEventListener("resize", updateTone);
    return () => {
      window.removeEventListener("scroll", updateTone);
      window.removeEventListener("resize", updateTone);
    };
  }, [isHome, resolvedTheme]);

  const navItems = [
    {
      name: t("home"),
      link: "/",
      icon: <House className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("models"),
      link: "/#models",
      icon: <Bot className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("credits"),
      link: "/#how",
      icon: <Coins className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("impact"),
      link: "/#impact",
      icon: <Leaf className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("faq"),
      link: "/faq",
      icon: <CircleHelp className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <FloatingNav
      tone={heroTone ? "hero" : "default"}
      navItems={navItems}
      brand={
        <Link href="/" className="flex items-center">
          <BrandLogo
            className={
              heroTone
                ? "h-10 w-10 [filter:brightness(0)_invert(1)] dark:[filter:none]"
                : "h-10 w-10"
            }
            priority
          />
        </Link>
      }
      actions={
        <>
          <ThemeToggle
            className={
              heroTone
                ? "text-white/82 hover:bg-white/8 hover:text-white"
                : undefined
            }
          />
          <SignedOut>
            <Button
              variant="ghost"
              className={
                heroTone
                  ? "text-white/82 hover:bg-white/8 hover:text-white"
                  : undefined
              }
              asChild
            >
              <Link href="/sign-in">{t("signIn")}</Link>
            </Button>
            <Button
              className={
                heroTone
                  ? "bg-[rgba(247,243,231,0.92)] text-[#1f2718] hover:bg-[rgba(247,243,231,1)]"
                  : undefined
              }
              asChild
            >
              <Link href="/sign-up">{t("startFree")}</Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              variant="ghost"
              className={
                heroTone
                  ? "text-white/82 hover:bg-white/8 hover:text-white"
                  : undefined
              }
              asChild
            >
              <Link href="/chat">{t("openApp")}</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </>
      }
    />
  );
}
