"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app/app-sidebar";
import { PaymentGraceBanner } from "@/components/app/payment-grace-banner";
import { PlanWelcomeWatcher } from "@/components/app/plan-welcome-watcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    router.prefetch("/chat");
    router.prefetch("/settings");
    router.prefetch("/contribution");
  }, [router]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-card text-foreground">
      <PaymentGraceBanner />
      <PlanWelcomeWatcher />
      <ThemeToggle className="fixed right-4 top-3 z-50 h-9 w-9 rounded-full border border-border/60 bg-background/85 shadow-sm backdrop-blur transition hover:bg-muted" />
      <AppSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-card">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-40 inline-flex rounded-full border border-border/60 bg-background/90 p-2 text-muted-foreground shadow-sm backdrop-blur md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <main className="min-h-0 flex-1 overflow-hidden pt-2">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-[2rem] border-l border-t border-border/50 bg-background">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
