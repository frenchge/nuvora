import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const next = new URLSearchParams();
  next.set("tab", "billing");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (key === "tab" || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        next.append(key, item);
      }
    } else {
      next.set(key, value);
    }
  }

  redirect(`/settings?${next.toString()}`);
}
