import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Leaf,
  ScanLine,
  ShieldCheck,
  Sprout,
  TreePine,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const PARTNER_KEYS = ["mangrove", "arbor"] as const;
const HOW_KEYS = ["step1", "step2", "step3", "step4"] as const;
const HONESTY_KEYS = ["noOffset", "noFarmed", "noStatistics"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Impact" });
  return buildPageMetadata({
    locale: locale as Locale,
    path: "/impact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ImpactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Impact");

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
                <Link href="#partners">{t("heroSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="grid gap-10 md:grid-cols-4">
          <Stat
            value={t("summary.trees")}
            label={t("summary.treesLabel")}
            icon={TreePine}
          />
          <Stat
            value={t("summary.species")}
            label={t("summary.speciesLabel")}
            icon={Sprout}
          />
          <Stat
            value={t("summary.maturity")}
            label={t("summary.maturityLabel")}
            icon={ShieldCheck}
          />
          <Stat
            value={t("summary.years")}
            label={t("summary.yearsLabel")}
            icon={Globe2}
          />
        </div>
      </section>

      <section
        id="partners"
        className="border-y border-border/60 bg-[hsl(var(--accent)/0.55)]"
      >
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("partnersTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("partnersBody")}</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {PARTNER_KEYS.map((key) => (
              <div
                key={key}
                className="rounded-3xl border border-border/60 bg-background/70 p-6"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Leaf className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">
                  {t(`partners.${key}.title`)}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">
                  {t(`partners.${key}.region`)}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t(`partners.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {t("howTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("howBody")}</p>
        </div>

        <ol className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HOW_KEYS.map((key, index) => (
            <li
              key={key}
              className="relative rounded-3xl border border-border/60 bg-card/50 p-6"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {index + 1}
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {t(`how.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`how.${key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border/60 bg-[hsl(var(--accent)/0.55)]">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("honestyTitle")}
            </h2>
          </div>

          <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {HONESTY_KEYS.map((key) => (
              <div key={key} className="flex gap-4">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-base font-semibold tracking-tight">
                    {t(`honesty.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`honesty.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-24 pt-24">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background px-8 py-16 text-center md:px-16 md:py-20">
          <ScanLine className="mx-auto h-6 w-6 text-primary" />
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

function Stat({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: typeof TreePine;
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/40 p-6">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-5 text-4xl font-semibold tracking-tight">{value}</div>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
