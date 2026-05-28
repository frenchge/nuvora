"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CreditCard, Leaf, Shield, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TabDef = {
  id: string;
  label: string;
  icon: "user" | "credit-card" | "leaf" | "shield";
};

const ICONS = {
  user: UserRound,
  "credit-card": CreditCard,
  leaf: Leaf,
  shield: Shield,
} as const;

export function SettingsShell({
  tabs,
  initialTab,
  heading,
  subtitle,
  badgeLabel,
  email,
  notifications,
  sections,
}: {
  tabs: readonly TabDef[];
  initialTab: string;
  heading: string;
  subtitle: string;
  badgeLabel: string;
  email: string;
  notifications?: React.ReactNode;
  sections: Record<string, React.ReactNode>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isPending, startTransition] = useTransition();

  const activeSection = useMemo(
    () => sections[activeTab] ?? sections[tabs[0]?.id ?? ""],
    [activeTab, sections, tabs],
  );

  const selectTab = (tabId: string) => {
    setActiveTab(tabId);
    startTransition(() => {
      router.replace(`${pathname}?tab=${tabId}`, { scroll: false });
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <aside className="hidden w-[240px] shrink-0 border-r border-border/50 px-8 py-4 lg:block">
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = ICONS[tab.icon];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm transition",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-8 pb-8 pt-10">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex flex-col gap-4 border-b border-border/50 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {heading}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {badgeLabel}
                  </Badge>
                  <span>{email}</span>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto lg:hidden">
                {tabs.map((tab) => {
                  const Icon = ICONS[tab.icon];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => selectTab(tab.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="py-6">
              {notifications}
              {isPending ? <SettingsTabSkeleton /> : activeSection}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTabSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
