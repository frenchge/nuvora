import type { Metadata } from "next";
import {
  ArrowRight,
  HelpCircle,
  Leaf,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const LANES = [
  { key: "general", icon: Mail, address: "hello@vercilio.ai" },
  { key: "support", icon: HelpCircle, address: "support@vercilio.ai" },
  { key: "partnerships", icon: Leaf, address: "partners@vercilio.ai" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return { title: t("metaTitle"), description: t("metaDescription") };
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
          {LANES.map(({ key, icon: Icon, address }) => (
            <a
              key={address}
              href={`mailto:${address}`}
              className="group rounded-3xl border border-border/60 bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                {t(`lanes.${key}.label`)}
              </div>
              <div className="mt-1 font-semibold tracking-tight">{address}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`lanes.${key}.helper`)}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                {t("openMail")}
                <ArrowRight className="h-3 w-3" />
              </div>
            </a>
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

          <form
            className="mt-8 grid gap-5"
            action="mailto:hello@vercilio.ai"
            method="post"
            encType="text/plain"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label={t("form.nameLabel")}
                name="name"
                placeholder={t("form.namePlaceholder")}
                required
              />
              <Field
                label={t("form.emailLabel")}
                name="email"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                required
              />
            </div>
            <Field
              label={t("form.subjectLabel")}
              name="subject"
              placeholder={t("form.subjectPlaceholder")}
            />
            <div className="grid gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("form.messageLabel")}
              </label>
              <textarea
                name="message"
                rows={6}
                placeholder={t("form.messagePlaceholder")}
                required
                className="w-full resize-y rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary/40 focus:bg-background/95"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t.rich("form.privacyNote", {
                  link: (chunks) => (
                    <Link href="/legal/privacy" className="underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
              <Button type="submit" size="lg">
                <Sparkles className="h-4 w-4" />
                {t("form.submit")}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email";
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40"
      />
    </div>
  );
}
