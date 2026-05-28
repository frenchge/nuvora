import type { Metadata } from "next";
import { ArrowRight, Leaf, Search, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const FAQ_KEYS = [
  "difference",
  "models",
  "free",
  "uploads",
  "contribution",
  "addons",
  "rollover",
  "cancel",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Faq" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Faq");

  return (
    <>
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("heroEyebrow")}
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
              {t("heroBody")}
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4 text-sm text-foreground/80">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("sidebar.models")}
            </div>
            <div className="flex items-start gap-3">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("sidebar.search")}
            </div>
            <div className="flex items-start gap-3">
              <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("sidebar.fund")}
            </div>
            <div className="flex items-start gap-3">
              <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t("sidebar.tiers")}
            </div>
          </div>

          <div className="divide-y divide-border/60 border-y border-border/60">
            {FAQ_KEYS.map((key) => (
              <div key={key} className="py-6">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t(`items.${key}.question`)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`items.${key}.answer`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-24 pt-4">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("ctaTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {t("ctaBody")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                {t("ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
