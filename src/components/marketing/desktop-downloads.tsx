"use client";

import { Download, MonitorDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const DOWNLOAD_TARGETS = [
  {
    key: "mac" as const,
    href: process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_MAC_URL?.trim(),
  },
  {
    key: "windows" as const,
    href: process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_WINDOWS_URL?.trim(),
  },
].filter(
  (target): target is { key: "mac" | "windows"; href: string } => Boolean(target.href)
);

function getLabel(key: "mac" | "windows", t: ReturnType<typeof useTranslations>) {
  return key === "mac" ? t("downloadForMac") : t("downloadForWindows");
}

export function DesktopDownloadMenu({
  tone = "default",
  className,
}: {
  tone?: "default" | "hero";
  className?: string;
}) {
  const t = useTranslations("Nav");

  if (DOWNLOAD_TARGETS.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            tone === "hero" && "text-white/82 hover:bg-white/8 hover:text-white",
            className
          )}
        >
          <Download className="h-4 w-4" />
          {t("downloadApp")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("downloadApp")}</DropdownMenuLabel>
        {DOWNLOAD_TARGETS.map((target) => (
          <DropdownMenuItem key={target.key} asChild>
            <a href={target.href} target="_blank" rel="noreferrer">
              <MonitorDown className="h-4 w-4" />
              {getLabel(target.key, t)}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DesktopDownloadButtons({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
  const t = useTranslations("Home");

  if (DOWNLOAD_TARGETS.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      {DOWNLOAD_TARGETS.map((target) => (
        <Button
          key={target.key}
          size="lg"
          variant="outline"
          className={cn("min-w-[220px]", buttonClassName)}
          asChild
        >
          <a href={target.href} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
            {target.key === "mac" ? t("downloadForMac") : t("downloadForWindows")}
          </a>
        </Button>
      ))}
    </div>
  );
}

