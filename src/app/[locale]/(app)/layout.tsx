import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser().catch(() => null);
  if (!profile) {
    redirect("/sign-in");
  }

  return <AppShell>{children}</AppShell>;
}
