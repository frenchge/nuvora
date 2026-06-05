import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAuthAppearance } from "@/components/auth/clerk-appearance";

// Auth pages shouldn't surface in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("signUpTitle")} subtitle={t("signUpSubtitle")}>
      <SignUp appearance={clerkAuthAppearance} fallbackRedirectUrl="/chat" />
    </AuthShell>
  );
}
