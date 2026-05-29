import type { Metadata } from "next";
import Script from "next/script";
import { ArrowRight, Clock3 } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { api } from "@convex/_generated/api";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { fetchQuery } from "@/lib/convex-server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAbsoluteUrl } from "@/lib/site";

const BLOG_COPY = {
  en: {
    title: "Blog — Vercilio",
    description:
      "Guides, product notes, and practical AI workflows from the Vercilio team.",
    eyebrow: "The Vercilio blog",
    heading: "Clear writing for calmer AI work.",
    body:
      "Product notes, buying guides, prompt workflows, and practical advice for teams trying to use AI without drowning in noise.",
    empty: "No posts are published yet. The first one is on the way.",
    readArticle: "Read article",
    minRead: "min read",
  },
  fr: {
    title: "Blog — Vercilio",
    description:
      "Guides, notes produit et workflows IA pratiques publiés par l'équipe Vercilio.",
    eyebrow: "Le blog Vercilio",
    heading: "Des articles clairs pour une IA plus apaisée.",
    body:
      "Notes produit, guides d'achat, workflows de prompt et conseils pratiques pour les équipes qui veulent utiliser l'IA sans le bruit.",
    empty: "Aucun article n'est encore publié. Le premier arrive bientôt.",
    readArticle: "Lire l'article",
    minRead: "min de lecture",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = BLOG_COPY[locale as Locale] ?? BLOG_COPY.en;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: getAbsoluteUrl(locale as Locale, "/blog"),
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: getAbsoluteUrl(locale as Locale, "/blog"),
      siteName: "Vercilio",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: copy.title,
      description: copy.description,
    },
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const copy = BLOG_COPY[typedLocale] ?? BLOG_COPY.en;
  const posts = await fetchQuery(api.blog.listPublished, {});

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.title,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getAbsoluteUrl(typedLocale, `/blog/${post.slug}`),
      name: post.title,
      description: post.metaDescription,
    })),
  };

  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-[420px] bg-[radial-gradient(60%_55%_at_50%_20%,hsl(var(--primary)/0.18),transparent_72%)]" />
        <div className="container relative pb-16 pt-28 md:pb-24 md:pt-36">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-tight md:text-6xl">
              {copy.heading}
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
              {copy.body}
            </p>
          </div>
        </div>
      </section>

      <section className="container py-14 md:py-18">
        {posts.length === 0 ? (
          <div className="rounded-[2rem] border border-border/60 bg-card/60 px-8 py-12 text-center text-muted-foreground">
            {copy.empty}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex h-full flex-col rounded-[2rem] border border-border/60 bg-card/65 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <span>{new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-border">/</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {post.readingMinutes} {copy.minRead}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                  <Link href={`/blog/${post.slug}`} className="transition group-hover:text-primary">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {post.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-8">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition group-hover:text-primary"
                  >
                    {copy.readArticle}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />

      <Script id={`blog-index-jsonld-${locale}`} type="application/ld+json">
        {JSON.stringify(itemListSchema)}
      </Script>
    </>
  );
}
