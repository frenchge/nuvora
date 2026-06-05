import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";
import {
  CAREERS_LOCATION,
  CAREER_ROLES,
  getCareerRole,
  TEAM_INTRO,
} from "@/lib/careers";
import type { Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Link } from "@/i18n/navigation";

export function generateStaticParams() {
  return CAREER_ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const role = getCareerRole(slug);

  if (!role) {
    return { title: "Careers — Vercilio" };
  }

  return buildPageMetadata({
    locale: locale as Locale,
    path: `/careers/${role.slug}`,
    title: `${role.title} — Careers at Vercilio`,
    description: role.summary,
  });
}

export default async function CareerRolePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const role = getCareerRole(slug);
  if (!role) {
    notFound();
  }

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[400px] bg-[radial-gradient(60%_50%_at_50%_25%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="container relative pt-24 pb-4 md:pt-32">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All roles
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Careers
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.07] tracking-tight md:text-6xl">
              {role.title}
            </h1>
            <p className="mx-auto mt-5 text-sm text-muted-foreground md:text-base">
              {role.team} · {CAREERS_LOCATION}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Application: ${encodeURIComponent(
                role.title,
              )}`}
              className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" />
              Send us an email to join us
            </a>
          </div>
        </div>
      </section>

      <article className="container pb-12">
        <div className="mx-auto max-w-3xl pt-14">
          <Section title="About the team">
            <p className="text-base leading-7 text-muted-foreground">
              {TEAM_INTRO[role.team]}
            </p>
          </Section>

          <Section title="About the role">
            {role.about.map((paragraph, index) => (
              <p
                key={index}
                className="text-base leading-7 text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </Section>

          <Section title="In this role, you will">
            <BulletList items={role.responsibilities} />
          </Section>

          <Section title="You might thrive here if">
            <BulletList items={role.qualifications} />
          </Section>

          <div className="mt-14 rounded-[2rem] border border-border/60 bg-card/40 p-8 text-center sm:p-10">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              Sound like you?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-balance text-sm leading-7 text-muted-foreground md:text-base">
              There's no formal application — just send us an email telling us a
              little about yourself, why this role, and anything you've built
              that you're proud of. We read every message.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Application: ${encodeURIComponent(
                role.title,
              )}`}
              className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" />
              Send us an email to join us
            </a>
            <p className="mt-4 text-sm text-muted-foreground">{CONTACT_EMAIL}</p>
          </div>
        </div>
      </article>

      <SiteFooter />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 first:mt-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
          <span className="text-base leading-7 text-muted-foreground">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
