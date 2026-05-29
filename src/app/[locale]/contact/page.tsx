import type { Metadata } from "next";
import { ArrowRight, HelpCircle, Leaf, Mail, MessageCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ContactForm } from "./_contact-form";

const LANES = [
  { key: "general", icon: Mail },
  { key: "support", icon: HelpCircle },
  { key: "partnerships", icon: Leaf },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return buildPageMetadata({
    locale: locale as Locale,
    path: "/contact",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[400px] bg-[radial-gradient(60%_50%_at_50%_30%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="container relative pt-24 pb-12 text-center md:pt-32">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <MessageCircle className="h-3 w-3 text-primary" />
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

      <section className="container pb-12">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {LANES.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className="rounded-3xl border border-border/60 bg-card/60 p-6"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                {t(`lanes.${key}.label`)}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`lanes.${key}.helper`)}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                {t("formTitle")}
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card/40 p-8 sm:p-10">
          <h2 className="text-balance text-2xl font-semibold tracking-tight">
            {t("formTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("formSubtitle")}
          </p>

          {(() => {
            const rawNote = t("form.privacyNote");
            const linkMatch = rawNote.match(/<link>(.*?)<\/link>/);
            const linkText = linkMatch?.[1] ?? "privacy policy";
            const [privacyPrefix = "", privacySuffix = ""] = rawNote.split(
              /<link>.*?<\/link>/,
            );
            return (
              <ContactForm
                copy={{
                  nameLabel: t("form.nameLabel"),
                  namePlaceholder: t("form.namePlaceholder"),
                  emailLabel: t("form.emailLabel"),
                  emailPlaceholder: t("form.emailPlaceholder"),
                  subjectLabel: t("form.subjectLabel"),
                  subjectPlaceholder: t("form.subjectPlaceholder"),
                  messageLabel: t("form.messageLabel"),
                  messagePlaceholder: t("form.messagePlaceholder"),
                  privacyPrefix,
                  privacyLinkText: linkText,
                  privacySuffix,
                  submit: t("form.submit"),
                }}
              />
            );
          })()}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
