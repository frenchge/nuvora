import { SignIn } from "@clerk/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { clerkAuthAppearance } from "@/components/auth/clerk-appearance";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");
  return (
    <AuthShell title={t("signInTitle")} subtitle={t("signInSubtitle")}>
      <SignIn appearance={clerkAuthAppearance} fallbackRedirectUrl="/chat" />
    </AuthShell>
  );
}
