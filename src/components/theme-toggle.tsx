"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skip rendering until mounted to avoid an SSR/CSR icon flash.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground",
          className,
        )}
        disabled
      />
    );
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <AnimatedThemeToggler
      aria-label="Toggle theme"
      isDark={isDark}
      onToggle={(next) => setTheme(next ? "dark" : "light")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground [&_svg]:h-4 [&_svg]:w-4",
        className,
      )}
    />
  );
}
