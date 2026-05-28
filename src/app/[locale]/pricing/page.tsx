import type { Metadata } from "next";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CREDIT_ADDONS, PLAN_DISPLAY, PLAN_ORDER } from "@/lib/plans";
import { formatCredits, formatEur } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pricing" });
  return { title: t("metaTitle") };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pricing");

  const comparisonRows = [
    {
      label: t("rows.price"),
      values: PLAN_ORDER.map((plan) =>
        plan === "free"
          ? t("values.free")
          : t("values.perMonth", {
              value: formatEur(PLAN_DISPLAY[plan].price, { precision: 0 }),
            }),
      ),
    },
    {
      label: t("rows.credits"),
      values: PLAN_ORDER.map((plan) =>
        formatCredits(PLAN_DISPLAY[plan].credits),
      ),
    },
    {
      label: t("rows.models"),
      values: PLAN_ORDER.map((plan) =>
        plan === "free"
          ? t("values.fastSmallModels")
          : t("values.allPaidModels"),
      ),
    },
    {
      label: t("rows.uploads"),
      values: PLAN_ORDER.map((plan) =>
        plan === "free" ? t("values.freeUploads") : t("values.paidUploads"),
      ),
    },
    {
      label: t("rows.daily"),
      values: PLAN_ORDER.map((plan) => t(`values.daily.${plan}`)),
    },
    {
      label: t("rows.contribution"),
      values: PLAN_ORDER.map((plan) => {
        if (plan === "free") return t("values.freeTrees");
        return t("values.paidTrees", { count: PLAN_DISPLAY[plan].trees });
      }),
    },
    {
      label: t("rows.bestFor"),
      values: PLAN_ORDER.map((plan) => t(`values.bestFor.${plan}`)),
    },
  ];

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
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("compareTitle")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("compareBody")}
              </p>
            </div>
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t("sidebar.workspace")}
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t("sidebar.included")}
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t("sidebar.grow")}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[860px] border-y border-border/60">
              <div className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))] border-b border-border/60">
                <div className="py-5" />
                {PLAN_ORDER.map((plan) => {
                  const current = PLAN_DISPLAY[plan];
                  return (
                    <div
                      key={plan}
                      className="border-l border-border/60 px-5 py-5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-base font-semibold">
                          {current.label}
                        </div>
                        {current.highlighted && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            {t("popular")}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {t(`values.bestFor.${plan}`)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {comparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))] border-b border-border/50"
                >
                  <div className="px-5 py-4 text-sm font-medium text-foreground/80">
                    {row.label}
                  </div>
                  {row.values.map((value, index) => (
                    <div
                      key={`${row.label}-${PLAN_ORDER[index]}`}
                      className="border-l border-border/50 px-5 py-4 text-sm text-foreground/75"
                    >
                      {value}
                    </div>
                  ))}
                </div>
              ))}

              <div className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))]">
                <div className="px-5 py-5 text-sm font-medium text-foreground/80">
                  {t("rows.cta")}
                </div>
                {PLAN_ORDER.map((plan) => {
                  const current = PLAN_DISPLAY[plan];
                  return (
                    <div
                      key={`cta-${plan}`}
                      className="border-l border-border/50 px-5 py-5"
                    >
                      {plan === "free" ? (
                        <Button className="w-full" variant="outline" asChild>
                          <Link href="/sign-up">{t("startFree")}</Link>
                        </Button>
                      ) : (
                        <Button className="w-full" asChild>
                          <Link href={`/billing?upgrade=${plan}`}>
                            {t("choose", { plan: current.label })}
                          </Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="border-y border-border/60">
          <div className="grid gap-4 py-6 md:grid-cols-[1.1fr_repeat(4,minmax(0,1fr))] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("addonsTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("addonsBody")}
              </p>
            </div>
            {CREDIT_ADDONS.map((addon) => (
              <div
                key={addon.key}
                className="border-l border-border/50 px-4 py-2"
              >
                <div className="text-lg font-semibold">
                  {formatCredits(addon.credits)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatEur(addon.price)}
                </div>
                <Button className="mt-4 w-full" variant="outline" asChild>
                  <Link href={`/billing?addon=${addon.key}`}>
                    {t("buyAddon")}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-24 pt-12">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">
              {t("questionsTitle")}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {t("questionsBody")}
            </p>
          </div>
          <Button size="lg" variant="outline" asChild>
            <Link href="/faq">
              {t("openFaq")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
