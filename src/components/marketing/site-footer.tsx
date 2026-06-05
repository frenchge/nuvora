import { Leaf, Mail, Twitter } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/lib/site";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-32 border-t border-border/60 bg-[hsl(var(--accent)/0.45)]">
      <div className="container grid gap-12 py-20 md:grid-cols-12">
        {/* Brand + tagline + updates */}
        <div className="md:col-span-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandLogo className="h-9 w-9" />
            <span className="text-base font-semibold tracking-tight">
              Vercilio
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
            {t("tagline")}
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4 text-primary" />
            {CONTACT_EMAIL}
          </a>

          <div className="mt-8 max-w-sm rounded-[1.5rem] border border-border/60 bg-background/55 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/80">
              {t("newsletterHeading")}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Follow Vercilio updates on the blog and on X. We removed email signup for now.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/blog"
                className="rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
              >
                Read the blog
              </Link>
              <a
                href="https://x.com/vercilioai"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-background"
              >
                Follow on X
              </a>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 text-muted-foreground">
            <SocialLink
              href="https://x.com/vercilioai"
              label={t("social.twitter")}
              icon={Twitter}
            />
          </div>
        </div>

        {/* Link columns */}
        <FooterColumn
          heading={t("productHeading")}
          className="md:col-span-2"
          links={[
            { href: "/models", label: t("links.models") },
            { href: "/pricing", label: t("links.pricing") },
            { href: "/impact", label: t("links.impact") },
          ]}
        />
        <FooterColumn
          heading={t("companyHeading")}
          className="md:col-span-2"
          links={[
            { href: "/about", label: t("links.about") },
            { href: "/careers", label: t("links.careers") },
            { href: "/contact", label: t("links.contact") },
          ]}
        />
        <FooterColumn
          heading={t("resourcesHeading")}
          className="md:col-span-2"
          links={[
            { href: "/blog", label: t("links.blog") },
            { href: "/faq", label: t("links.faq") },
          ]}
        />
        <FooterColumn
          heading={t("legalHeading")}
          className="md:col-span-1"
          links={[
            { href: "/legal/terms", label: t("links.terms") },
            { href: "/legal/privacy", label: t("links.privacy") },
            { href: "/legal/cookies", label: t("links.cookies") },
          ]}
        />
      </div>

      <div className="border-t border-border/40">
        <div className="container flex flex-col items-start justify-between gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-primary" />
            <span>{t("credit")}</span>
          </div>
          <span>{t("copyright", { year })}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
  className,
}: {
  heading: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/80">
        {heading}
      </div>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Twitter;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
