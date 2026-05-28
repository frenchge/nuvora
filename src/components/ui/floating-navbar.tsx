"use client";

import * as React from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { cn } from "@/lib/utils";

export function FloatingNav({
  navItems,
  className,
  brand,
  actions,
  tone = "default",
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
  brand?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "default" | "hero";
}) {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = React.useState(true);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current !== "number") return;
    const previous = scrollYProgress.getPrevious() ?? 0;
    const direction = current - previous;

    if (scrollYProgress.get() < 0.04) {
      setVisible(true);
      return;
    }

    setVisible(direction < 0);
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: -100 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className={cn(
          "fixed inset-x-0 top-5 z-[5000] mx-auto flex w-full justify-center px-4",
          className,
        )}
      >
        <div
          className={cn(
            "flex w-full max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2 shadow-lg backdrop-blur-xl transition-colors",
            tone === "hero"
              ? "border border-[rgba(220,229,208,0.18)] bg-[rgba(28,34,23,0.34)] text-white shadow-black/18"
              : "border border-[rgba(122,136,84,0.12)] bg-[rgba(255,252,245,0.78)] text-foreground shadow-black/8 dark:border-[rgba(228,234,214,0.08)] dark:bg-[rgba(24,28,21,0.78)] dark:text-[hsl(var(--foreground))] dark:shadow-black/24",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            {brand ? <div className="shrink-0">{brand}</div> : null}
            <div className="flex min-w-0 items-center gap-1">
              {navItems.map((navItem, index) => (
                <Link
                  key={`${navItem.link}-${index}`}
                  href={navItem.link}
                  prefetch
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    tone === "hero"
                      ? "text-white/82 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground dark:text-[hsl(var(--foreground))/0.82] dark:hover:bg-white/8 dark:hover:text-[hsl(var(--foreground))]",
                  )}
                >
                  <span className="block md:hidden">{navItem.icon}</span>
                  <span className="hidden md:block">{navItem.name}</span>
                </Link>
              ))}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
