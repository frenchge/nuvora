"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/locale-provider";
import type { AppLocale } from "@/lib/i18n";

export function LanguageSelect({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  const { locale, setLocale, languages } = useLocale();
  const initialValue = (defaultValue || locale) as AppLocale;
  const [value, setValue] = useState<AppLocale>(initialValue);

  useEffect(() => {
    setValue((defaultValue || locale) as AppLocale);
  }, [defaultValue, locale]);

  const selected = languages.find((language) => language.code === value) ?? languages[0];

  return (
    <label className="space-y-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <input type="hidden" name={name} value={value} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-11 w-full items-center justify-between rounded-full border border-border/60 bg-white px-4 text-sm text-foreground outline-none transition-colors hover:border-primary/30 hover:bg-background focus-visible:ring-2 focus-visible:ring-ring dark:bg-card"
          >
            <span>{selected.label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
          {languages.map((language) => {
            const active = language.code === value;
            return (
              <DropdownMenuItem
                key={language.code}
                onSelect={() => {
                  const next = language.code as AppLocale;
                  setValue(next);
                  setLocale(next);
                }}
                className={cn(active && "bg-accent text-accent-foreground")}
              >
                <span className="flex-1">{language.label}</span>
                {active ? <Check className="h-4 w-4" /> : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  );
}
