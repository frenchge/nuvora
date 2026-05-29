import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Leaf,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ProviderLogoMarquee } from "@/components/marketing/app-mockup";
import { ImpactMap } from "@/components/marketing/impact-map";
import { Button } from "@/components/ui/button";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { Link } from "@/i18n/navigation";
import { PLAN_DISPLAY, PLAN_ORDER } from "@/lib/plans";
import { formatCredits, formatEur } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  return buildPageMetadata({
    locale: locale as Locale,
    path: "/",
    title: t("scrollMediaTitle"),
    description: t("scrollMediaSubtitle"),
  });
}

const VALUE_KEYS = ["best", "good", "yours", "calm"] as const;
const VALUE_ICONS = {
  best: Sparkles,
  good: Leaf,
  yours: ShieldCheck,
  calm: Zap,
} as const;

const FAQ_KEYS = ["models", "free", "fund", "uploads"] as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <>
      <SiteHeader />

      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1"
        posterSrc="https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg"
        bgImageSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS"
        title={t("scrollMediaTitle")}
        subtitle={t("scrollMediaSubtitle")}
        date={t("scrollMediaDate")}
        scrollToExpand={t("scrollMediaCue")}
        textBlend
      >
        <div className="flex flex-col items-center text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Leaf className="h-3 w-3 text-primary" />
            {t("heroBadge")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            {t.rich("heroTitle", {
              accent: (chunks) => <span className="text-primary"> {chunks}</span>,
            })}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
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
          <p className="mt-3 text-xs text-muted-foreground">
            {t("heroFootnote")}
          </p>
        </div>
      </ScrollExpandMedia>

      <section
        id="models"
        className="border-y border-border/50 bg-[hsl(var(--accent))]"
      >
        <div className="container py-10">
          <p className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {t("providersEyebrow")}
          </p>
          <ProviderLogoMarquee className="mt-6" />
        </div>
      </section>

      <section id="how" className="bg-background">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("valuesTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("valuesBody")}</p>
          </div>

          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {VALUE_KEYS.map((key) => {
              const Icon = VALUE_ICONS[key];
              return (
                <div key={key} className="flex gap-4">
                  <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {t(`values.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {t(`values.${key}.body`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="impact"
        className="border-y border-border/60 bg-[hsl(var(--accent)/0.55)]"
      >
        <div className="container grid gap-12 py-24 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Leaf className="h-3 w-3" />
              {t("impactEyebrow")}
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              {t("impactTitle")}
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              {t("impactBody")}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {(["verified", "history", "longTerm"] as const).map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/80">
                    {t(`impactPoints.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <ImpactLine
              icon={Leaf}
              value="3.9M+"
              label={t("impactStats.trees")}
            />
            <ImpactLine
              icon={Sparkles}
              value="150+"
              label={t("impactStats.species")}
            />
            <ImpactLine
              icon={ShieldCheck}
              value="85%+"
              label={t("impactStats.maturity")}
            />
            <ImpactLine
              icon={Sparkles}
              value="15+"
              label={t("impactStats.stewardship")}
            />
          </div>
        </div>
        <div className="container pb-24">
          <ImpactMap />
        </div>
      </section>

      <section className="bg-background">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("plansTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("plansBody")}</p>
          </div>
          <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {PLAN_ORDER.map((p) => {
              const plan = PLAN_DISPLAY[p];
              return (
                <div
                  key={plan.name}
                  className="grid gap-4 py-6 md:grid-cols-[1.2fr_1fr_1fr_minmax(260px,auto)] md:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold capitalize">
                        {plan.label}
                      </div>
                      {plan.highlighted && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                          {t("planPopular")}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {plan.name === "free"
                        ? t("planDescFree")
                        : t("planDescPaid")}
                    </div>
                  </div>
                  <div className="text-3xl font-semibold tracking-tight">
                    {formatEur(plan.price, { precision: 0 })}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {t("planPerMonth")}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>
                      {t("planCreditsLine", {
                        credits: formatCredits(plan.credits),
                      })}
                    </div>
                    <div>{t("planTreesLine", { trees: plan.trees })}</div>
                  </div>
                  <div className="text-right">
                    {plan.trees > 0 ? (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
                        <Leaf className="h-3 w-3" />
                        {t("planEcoBadge")}
                      </div>
                    ) : (
                      <span aria-hidden className="invisible text-[11px]">
                        placeholder
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">{t("seeFullPricing")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--accent))]">
        <div className="container pb-24 pt-24">
          <div className="text-center">
            <h3 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("ctaTitle")}
            </h3>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              {t("ctaBody")}
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  {t("ctaPrimary")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-background">
        <div className="container pb-24 pt-24">
          <div className="mx-auto max-w-3xl border-t border-border/60 pt-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {t("faqTitle")}
              </h2>
              <p className="mt-3 text-muted-foreground">{t("faqBody")}</p>
            </div>

            <div className="mt-10 divide-y divide-border/60 border-y border-border/60">
              {FAQ_KEYS.map((key) => (
                <div key={key} className="py-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {t(`faqItems.${key}.question`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`faqItems.${key}.answer`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button variant="outline" asChild>
                <Link href="/faq">{t("readFullFaq")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function ImpactLine({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Leaf;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border/50 pb-6">
      <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
        <div className="mt-1 text-sm text-foreground/70">{label}</div>
      </div>
    </div>
  );
}
