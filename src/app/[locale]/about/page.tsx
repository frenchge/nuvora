import type { Metadata } from "next";
import {
  Compass,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Trees,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const PRINCIPLE_ICONS = {
  clarity: Compass,
  privacy: ShieldCheck,
  opinion: Heart,
  margin: Leaf,
} as const;

type PrincipleKey = keyof typeof PRINCIPLE_ICONS;
const PRINCIPLE_KEYS = Object.keys(PRINCIPLE_ICONS) as PrincipleKey[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-32 h-[440px] bg-[radial-gradient(60%_50%_at_50%_30%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="container relative pt-24 pb-16 text-center md:pt-32">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Trees className="h-3 w-3 text-primary" />
            {t("heroEyebrow")}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {t.rich("heroTitle", {
              accent: (chunks) => <span className="text-primary">{chunks}</span>,
            })}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
            {t("heroBody")}
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-base leading-8 text-foreground/80">
          <p>{t("storyParagraph1")}</p>
          <p>{t("storyParagraph2")}</p>
          <p>{t("storyParagraph3")}</p>
        </div>
      </section>

      <section className="bg-secondary/40 border-y border-border/60">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("principlesTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("principlesSubtitle")}
            </p>
          </div>
          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {PRINCIPLE_KEYS.map((key) => {
              const Icon = PRINCIPLE_ICONS[key];
              return (
                <div key={key} className="flex gap-4">
                  <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {t(`principles.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {t(`principles.${key}.body`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-accent/70 border-y border-border/60">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {t("simplerDealTitle")}
            </h2>
            <p className="mt-3 text-foreground/75">{t("simplerDealBody")}</p>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background px-8 py-16 text-center md:px-16 md:py-20">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h3 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {t("ctaTitle")}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {t("ctaBody")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">{t("ctaPrimary")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
