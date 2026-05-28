"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  Bot,
  CircleHelp,
  Coins,
  House,
  Leaf,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  {
    name: "Home",
    link: "/",
    icon: <House className="h-4 w-4 text-muted-foreground" />,
  },
  {
    name: "Models",
    link: "/#models",
    icon: <Bot className="h-4 w-4 text-muted-foreground" />,
  },
  {
    name: "Credits",
    link: "/#how",
    icon: <Coins className="h-4 w-4 text-muted-foreground" />,
  },
  {
    name: "Impact",
    link: "/#impact",
    icon: <Leaf className="h-4 w-4 text-muted-foreground" />,
  },
  {
    name: "FAQ",
    link: "/faq",
    icon: <CircleHelp className="h-4 w-4 text-muted-foreground" />,
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  // Start in the neutral "default" tone so SSR and the first client render
  // agree. next-themes only knows the real theme after mount, so flipping to
  // hero tone before then guarantees a hydration mismatch.
  const [heroTone, setHeroTone] = useState(false);

  useEffect(() => {
    const updateTone = () => {
      if (pathname !== "/" || resolvedTheme === "dark") {
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
  }, [pathname, resolvedTheme]);

  return (
    <>
      <FloatingNav
        tone={heroTone ? "hero" : "default"}
        navItems={NAV_ITEMS}
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
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button
                className={
                  heroTone
                    ? "bg-[rgba(247,243,231,0.92)] text-[#1f2718] hover:bg-[rgba(247,243,231,1)]"
                    : undefined
                }
                asChild
              >
                <Link href="/sign-up">Start free</Link>
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
                <Link href="/chat">Open app</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </>
        }
      />
    </>
  );
}
