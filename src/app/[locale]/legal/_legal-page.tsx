import { Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

// Reusable legal page shell. Each route (terms, privacy, cookies) pulls
// its own namespace from messages/{en,fr}.json — the dict shape is:
//   metaTitle, metaDescription, heroEyebrow, heroTitle, heroBody,
//   sections: [{ title, paragraphs: string[] }, ...]
//
// Sections are read via t.raw() so adding/reordering them is a JSON edit
// instead of a page-component change. The legal contact block (last
// updated date, controller, supervisory authority) comes from a shared
// "Legal" namespace so it can be edited once.
export async function LegalPage({ namespace }: { namespace: string }) {
  const t = await getTranslations(namespace);
  const legalT = await getTranslations("Legal");
  const sections = t.raw("sections") as Array<{
    title: string;
    paragraphs: string[];
  }>;

  return (
    <>
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="container pb-16 pt-32 md:pb-20 md:pt-40">
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
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-xs text-muted-foreground">
              <Scale className="h-3 w-3 text-primary" />
              {legalT("lastUpdatedLabel")}: {legalT("lastUpdatedValue")}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {sections.map((section, index) => (
            <article key={index}>
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-foreground/85">
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}

          <aside className="mt-16 rounded-3xl border border-border/60 bg-card/40 p-6 text-sm leading-7 text-foreground/80">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {legalT("controllerLabel")}
              </div>
              <p className="mt-2">{legalT("controllerValue")}</p>
            </div>
            <div className="mt-6 border-t border-border/40 pt-6">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {legalT("supervisoryLabel")}
              </div>
              <p className="mt-2">{legalT("supervisoryValue")}</p>
            </div>
            <div className="mt-6 border-t border-border/40 pt-6">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {legalT("disclaimerLabel")}
              </div>
              <p className="mt-2 text-muted-foreground">
                {legalT("disclaimerValue")}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
