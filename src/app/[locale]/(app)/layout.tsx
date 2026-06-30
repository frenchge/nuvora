import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getOrCreateProfile } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The ONLY condition that means "not signed in" is a missing Clerk session.
  // That's the one case where redirecting to /sign-in is correct.
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // The session is valid, so ensure the Convex profile row exists. If this
  // throws (e.g. the `convex` JWT template or CLERK_JWT_ISSUER_DOMAIN is
  // misconfigured), we must NOT fall back to /sign-in: the sign-in page sees
  // the active session and immediately sends us back to /chat, which loops
  // forever. Let the real error surface instead of hiding it behind a redirect.
  await getOrCreateProfile();

  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <AppShell>{children}</AppShell>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
