import type { Metadata } from "next";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Code2,
  Coins,
  Eye,
  Pencil,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const HOW_KEYS = ["monthly", "perMessage", "transparent", "addons"] as const;
const HOW_ICONS = {
  monthly: Calendar,
  perMessage: Coins,
  transparent: Eye,
  addons: PlusCircle,
};

const TIER_KEYS = ["small", "standard", "advanced", "premium", "elite"] as const;

const EXAMPLE_KEYS = ["writer", "researcher", "developer"] as const;
const EXAMPLE_ICONS = {
  writer: Pencil,
  researcher: Briefcase,
  developer: Code2,
};

const FAQ_KEYS = ["rollover", "refund", "fairness", "limit"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Credits" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function CreditsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Credits");

  return (
    <>
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="container pb-20 pt-32 md:pb-24 md:pt-40">
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
            <div className="mt-9 flex items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  {t("heroPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">{t("heroSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {t("howTitle")}
          </h2>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {HOW_KEYS.map((key) => {
            const Icon = HOW_ICONS[key];
            return (
              <div key={key} className="flex gap-4">
                <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">
                    {t(`how.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`how.${key}.body`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/60 bg-[hsl(var(--secondary)/0.4)]">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("tiersTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("tiersBody")}</p>
          </div>

          <div className="mt-14 mx-auto max-w-3xl divide-y divide-border/60 border-y border-border/60 bg-background/40">
            {TIER_KEYS.map((key) => (
              <div
                key={key}
                className="grid items-center gap-4 px-6 py-5 md:grid-cols-[140px_120px_minmax(0,1fr)]"
              >
                <div className="text-sm font-semibold tracking-tight">
                  {t(`tiers.${key}.label`)}
                </div>
                <div className="text-sm text-primary font-medium">
                  {t(`tiers.${key}.cost`)}
                </div>
                <div className="text-sm leading-6 text-muted-foreground">
                  {t(`tiers.${key}.body`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {t("examplesTitle")}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {EXAMPLE_KEYS.map((key) => {
            const Icon = EXAMPLE_ICONS[key];
            return (
              <div
                key={key}
                className="rounded-3xl border border-border/60 bg-card/50 p-6"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {t(`examples.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`examples.${key}.body`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border/60 bg-[hsl(var(--secondary)/0.4)]">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("faqTitle")}
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl divide-y divide-border/60 border-y border-border/60">
            {FAQ_KEYS.map((key) => (
              <div key={key} className="py-6">
                <h3 className="text-base font-semibold tracking-tight">
                  {t(`faqs.${key}.question`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`faqs.${key}.answer`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-24 pt-24">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background px-8 py-16 text-center md:px-16 md:py-20">
          <RefreshCw className="mx-auto h-6 w-6 text-primary" />
          <h3 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {t("ctaTitle")}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {t("ctaBody")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
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
