import type { Metadata } from "next";
import { ArrowUpRight, Mail } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";
import { CAREERS_LOCATION, listCareerRoles } from "@/lib/careers";
import type { Locale } from "@/i18n/routing";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale: locale as Locale,
    path: "/careers",
    title: "Careers — Vercilio",
    description:
      "Help build the calmest, fastest way to use the world's best AI models — and fund reforestation while we do it. Every role is fully remote.",
  });
}

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const roles = listCareerRoles();

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[420px] bg-[radial-gradient(60%_50%_at_50%_30%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="container relative pt-24 pb-12 text-center md:pt-32">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Careers
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Build AI that earns its place.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
            We're a small team making the world's best AI models simple to use —
            and funding verified reforestation with every subscription. Every
            role is fully remote, open to people anywhere.
          </p>
        </div>
      </section>

      <section className="container pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-baseline justify-between border-b border-border/60 pb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground/80">
              Open roles
            </h2>
            <span className="text-sm text-muted-foreground">
              {roles.length} open
            </span>
          </div>

          <ul>
            {roles.map((role) => (
              <li key={role.slug}>
                <Link
                  href={`/careers/${role.slug}`}
                  className="group flex flex-col gap-2 border-b border-border/60 py-6 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-2"
                >
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="text-lg font-medium tracking-tight text-foreground">
                      {role.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {role.team}
                    </span>
                  </span>
                  <span className="flex items-center gap-4 sm:shrink-0">
                    <span className="text-sm text-muted-foreground">
                      {CAREERS_LOCATION}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      View role
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-border/60 bg-card/40 p-8 text-center sm:p-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Don't see the right role?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-sm leading-7 text-muted-foreground md:text-base">
            We're always happy to meet thoughtful people. Tell us what you'd love
            to work on and why Vercilio — we read every message.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Joining Vercilio`}
            className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            Send us an email to join us
          </a>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
