"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname as useRawPathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Bot,
  CircleHelp,
  House,
  Leaf,
  Mail,
  Menu,
  Tag,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DesktopDownloadMenu } from "@/components/marketing/desktop-downloads";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function SiteHeader() {
  const rawPathname = useRawPathname();
  const { isSignedIn } = useAuth();
  const { resolvedTheme } = useTheme();
  const t = useTranslations("Nav");
  const [heroTone, setHeroTone] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [rawPathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navItems = [
    {
      name: t("home"),
      link: "/",
      icon: <House className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("models"),
      link: "/models",
      icon: <Bot className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("pricing"),
      link: "/pricing",
      icon: <Tag className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("blog"),
      link: "/blog",
      icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("impact"),
      link: "/impact",
      icon: <Leaf className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("faq"),
      link: "/faq",
      icon: <CircleHelp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      name: t("contact"),
      link: "/contact",
      icon: <Mail className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <>
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
            <div className="hidden items-center gap-1.5 md:flex sm:gap-2">
              <ThemeToggle
                className={
                  heroTone
                    ? "text-white/82 hover:bg-white/8 hover:text-white"
                    : undefined
                }
              />
              <DesktopDownloadMenu tone={heroTone ? "hero" : "default"} />
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
              {!isSignedIn ? (
                <>
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
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle
                className={
                  heroTone
                    ? "text-white/82 hover:bg-white/8 hover:text-white"
                    : undefined
                }
              />
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(true)}
                className={
                  heroTone
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-full text-white/82 transition hover:bg-white/8 hover:text-white"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-secondary"
                }
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </>
        }
      />

      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-[5100] bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed inset-x-4 top-5 z-[5200] rounded-[2rem] border border-border/60 bg-background/98 p-5 shadow-2xl transition-all duration-200 md:hidden ${
          mobileMenuOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center"
          >
            <BrandLogo className="h-10 w-10" priority />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          {navItems.map((item) => (
            <Link
              key={item.link}
              href={item.link}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium text-foreground transition hover:bg-secondary"
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="mt-5 border-t border-border/60 pt-5">
          <div className="grid gap-3">
            <DesktopDownloadMenu className="w-full justify-start px-0 text-left" />
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                {t("openApp")}
              </Link>
            </Button>
            {!isSignedIn ? (
              <>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    {t("signIn")}
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    {t("startFree")}
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
