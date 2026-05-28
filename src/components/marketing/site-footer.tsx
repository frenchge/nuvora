import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="border-t border-border/60 mt-24">
      <div className="container py-12 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center">
            <BrandLogo className="h-10 w-10" />
          </div>
          <p className="mt-3 text-muted-foreground">{t("tagline")}</p>
        </div>
        <div>
          <div className="font-medium mb-3">{t("productHeading")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/pricing" className="hover:text-foreground">
                {t("links.pricing")}
              </Link>
            </li>
            <li>
              <Link href="/#models" className="hover:text-foreground">
                {t("links.models")}
              </Link>
            </li>
            <li>
              <Link href="/#impact" className="hover:text-foreground">
                {t("links.impact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-medium mb-3">{t("companyHeading")}</div>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <Link href="/about" className="hover:text-foreground">
                {t("links.about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-foreground">
                {t("links.contact")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                {t("links.faq")}
              </Link>
            </li>
          </ul>
        </div>
        <div />
      </div>
      <div className="container border-t border-border/60 py-6 text-xs text-muted-foreground">
        <span>{t("copyright", { year: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}
