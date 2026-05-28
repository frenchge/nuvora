import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  Brain,
  Compass,
  Eye,
  FileText,
  Gauge,
  Layers,
  Search,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const PROVIDER_KEYS = [
  "openai",
  "anthropic",
  "google",
  "meta",
  "xai",
  "deepseek",
  "mistral",
  "cohere",
  "perplexity",
] as const;

const CATEGORY_KEYS = ["fast", "balanced", "advanced", "frontier"] as const;
const CATEGORY_ICONS = {
  fast: Zap,
  balanced: Layers,
  advanced: Brain,
  frontier: Sparkles,
};

const FEATURE_KEYS = [
  "vision",
  "files",
  "search",
  "reasoning",
  "auto",
  "tools",
] as const;
const FEATURE_ICONS = {
  vision: Eye,
  files: FileText,
  search: Search,
  reasoning: Brain,
  auto: Compass,
  tools: Wrench,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Models" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Models");

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
            {t("providersTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("providersBody")}</p>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {PROVIDER_KEYS.map((key) => (
            <div
              key={key}
              className="rounded-3xl border border-border/60 bg-card/50 p-6 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {t(`providers.${key}.name`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`providers.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-[hsl(var(--secondary)/0.4)]">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("categoriesTitle")}
            </h2>
            <p className="mt-4 text-muted-foreground">{t("categoriesBody")}</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_KEYS.map((key) => {
              const Icon = CATEGORY_ICONS[key];
              return (
                <div
                  key={key}
                  className="rounded-3xl border border-border/60 bg-background/70 p-6"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">
                    {t(`categories.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`categories.${key}.body`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {t("featuresTitle")}
          </h2>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <div key={key} className="flex gap-4">
                <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`features.${key}.body`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container pb-24">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background px-8 py-16 text-center md:px-16 md:py-20">
          <Gauge className="mx-auto h-6 w-6 text-primary" />
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
