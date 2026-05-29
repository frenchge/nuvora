import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { ArrowLeft, ArrowRight, Clock3, Leaf } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { api } from "@convex/_generated/api";
import { BlogMarkdown } from "@/components/blog/blog-markdown";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { fetchQuery } from "@/lib/convex-server";
import { extractBlogHeadings } from "@/lib/blog";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAbsoluteUrl } from "@/lib/site";

const ARTICLE_COPY = {
  en: {
    back: "Back to blog",
    minRead: "min read",
    contents: "On this page",
    ctaEyebrow: "Try Vercilio for free",
    ctaTitle: "Use the best AI models in one place.",
    ctaBody:
      "Start free, test Vercilio with your own workflow, and upgrade when you want more credits for serious daily use.",
    ctaImpactBadge: "Tree planting built in",
    ctaImpact: "Every paid plan also helps fund verified tree planting each month through our restoration partners.",
    ctaPrimary: "Start free",
    ctaSecondary: "See pricing",
    more: "More from the blog",
    quickRead: "This article is a quick read with no section jumps.",
    readNext: "Read next",
    blogName: "Blog",
    by: "By",
  },
  fr: {
    back: "Retour au blog",
    minRead: "min de lecture",
    contents: "Sur cette page",
    ctaEyebrow: "Essayer Vercilio gratuitement",
    ctaTitle: "Utilisez les meilleurs modèles d'IA au même endroit.",
    ctaBody:
      "Commencez gratuitement, testez Vercilio avec votre propre flux de travail, puis passez à un plan supérieur lorsque vous voulez plus de crédits au quotidien.",
    ctaImpactBadge: "Plantation d'arbres incluse",
    ctaImpact: "Chaque formule payante aide aussi à financer une plantation d'arbres vérifiée chaque mois via nos partenaires de restauration.",
    ctaPrimary: "Commencer gratuitement",
    ctaSecondary: "Voir les tarifs",
    more: "À lire aussi",
    quickRead: "Cet article est court et ne comporte pas de sections de navigation.",
    readNext: "Lire ensuite",
    blogName: "Blog",
    by: "Par",
  },
  es: {
    back: "Volver al blog",
    minRead: "min de lectura",
    contents: "En esta pagina",
    ctaEyebrow: "Prueba Vercilio gratis",
    ctaTitle: "Usa los mejores modelos de IA en un solo lugar.",
    ctaBody:
      "Empieza gratis, prueba Vercilio con tu propio flujo de trabajo y mejora tu plan cuando necesites más créditos para usarlo a diario.",
    ctaImpactBadge: "Plantación de árboles incluida",
    ctaImpact: "Cada plan de pago también ayuda a financiar plantación de árboles verificada cada mes a través de nuestros socios de restauración.",
    ctaPrimary: "Empezar gratis",
    ctaSecondary: "Ver precios",
    more: "Mas del blog",
    quickRead: "Este articulo es breve y no necesita saltos de seccion.",
    readNext: "Seguir leyendo",
    blogName: "Blog",
    by: "Por",
  },
  de: {
    back: "Zuruck zum Blog",
    minRead: "Min. Lesezeit",
    contents: "Auf dieser Seite",
    ctaEyebrow: "Vercilio kostenlos testen",
    ctaTitle: "Nutze die besten KI-Modelle an einem Ort.",
    ctaBody:
      "Starte kostenlos, teste Vercilio mit deinem eigenen Workflow und wechsle erst dann in einen bezahlten Plan, wenn du mehr Credits für den Alltag brauchst.",
    ctaImpactBadge: "Baumpflanzung inklusive",
    ctaImpact: "Jeder bezahlte Plan hilft außerdem dabei, jeden Monat verifizierte Baumpflanzungen über unsere Restaurationspartner zu finanzieren.",
    ctaPrimary: "Kostenlos starten",
    ctaSecondary: "Preise ansehen",
    more: "Mehr aus dem Blog",
    quickRead: "Dieser Artikel ist kurz und braucht keine Abschnittssprunge.",
    readNext: "Weiterlesen",
    blogName: "Blog",
    by: "Von",
  },
  it: {
    back: "Torna al blog",
    minRead: "min di lettura",
    contents: "In questa pagina",
    ctaEyebrow: "Prova Vercilio gratis",
    ctaTitle: "Usa i migliori modelli di IA in un solo posto.",
    ctaBody:
      "Inizia gratis, prova Vercilio con il tuo flusso di lavoro e passa a un piano superiore solo quando ti servono più crediti per usarlo ogni giorno.",
    ctaImpactBadge: "Piantumazione di alberi inclusa",
    ctaImpact: "Ogni piano a pagamento contribuisce anche a finanziare ogni mese progetti verificati di piantumazione di alberi tramite i nostri partner.",
    ctaPrimary: "Inizia gratis",
    ctaSecondary: "Vedi i prezzi",
    more: "Altri articoli del blog",
    quickRead: "Questo articolo e breve e non richiede salti tra sezioni.",
    readNext: "Continua a leggere",
    blogName: "Blog",
    by: "Di",
  },
  pt: {
    back: "Voltar ao blog",
    minRead: "min de leitura",
    contents: "Nesta pagina",
    ctaEyebrow: "Experimente a Vercilio gratis",
    ctaTitle: "Use os melhores modelos de IA em um so lugar.",
    ctaBody:
      "Comece gratis, teste a Vercilio com o seu proprio fluxo de trabalho e faca upgrade quando quiser mais creditos para usar no dia a dia.",
    ctaImpactBadge: "Plantio de arvores incluido",
    ctaImpact: "Cada plano pago tambem ajuda a financiar plantio de arvores verificado todos os meses por meio dos nossos parceiros de restauracao.",
    ctaPrimary: "Comecar gratis",
    ctaSecondary: "Ver planos",
    more: "Mais do blog",
    quickRead: "Este artigo e curto e nao precisa de saltos de secao.",
    readNext: "Ler a seguir",
    blogName: "Blog",
    by: "Por",
  },
} as const;

async function getBlogPost(locale: Locale, slug: string) {
  try {
    return await fetchQuery(api.blog.getPublishedBySlug, { locale, slug });
  } catch (error) {
    console.error("[blog] Failed to load post", { locale, slug, error });
    return null;
  }
}

async function listRelatedPosts(locale: Locale) {
  try {
    return await fetchQuery(api.blog.listPublished, { locale });
  } catch (error) {
    console.error("[blog] Failed to load related posts", { locale, error });
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = locale as Locale;
  const post = await getBlogPost(typedLocale, slug);

  if (!post) {
    return {
      title: "Blog — Vercilio",
    };
  }

  const canonicalUrl = getAbsoluteUrl(typedLocale, `/blog/${post.slug}`);

  return {
    title: post.seoTitle,
    description: post.metaDescription,
    keywords: post.tags,
    authors: [{ name: post.authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.seoTitle,
      description: post.metaDescription,
      url: canonicalUrl,
      siteName: "Vercilio",
      type: "article",
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.authorName],
      tags: post.tags,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
    twitter: {
      card: post.coverImageUrl ? "summary_large_image" : "summary",
      title: post.seoTitle,
      description: post.metaDescription,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const typedLocale = locale as Locale;
  setRequestLocale(locale);

  const copy = ARTICLE_COPY[typedLocale] ?? ARTICLE_COPY.en;
  const post = await getBlogPost(typedLocale, slug);
  if (!post) {
    notFound();
  }

  const allPosts = await listRelatedPosts(typedLocale);
  const relatedPosts = allPosts
    .filter((entry) => entry.slug !== post.slug)
    .slice(0, 3);
  const headings = extractBlogHeadings(post.bodyMarkdown);
  const canonicalUrl = getAbsoluteUrl(typedLocale, `/blog/${post.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.metaDescription,
        url: canonicalUrl,
        datePublished: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : new Date(post.updatedAt).toISOString(),
        dateModified: new Date(post.updatedAt).toISOString(),
        author: {
          "@type": "Person",
          name: post.authorName,
        },
        publisher: {
          "@type": "Organization",
          name: "Vercilio",
          url: getAbsoluteUrl(typedLocale, "/"),
        },
        articleSection: post.tags[0] ?? "Blog",
        keywords: post.tags.join(", "),
        image: post.coverImageUrl || undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Vercilio",
            item: getAbsoluteUrl(typedLocale, "/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.blogName,
            item: getAbsoluteUrl(typedLocale, "/blog"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <SiteHeader />

      <article className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(60%_55%_at_50%_10%,hsl(var(--primary)/0.18),transparent_72%)]" />
        <div className="container relative pb-16 pt-24 md:pt-32">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_250px]">
            <div>
              {post.coverImageUrl ? (
                <div className="mb-10 overflow-hidden rounded-[2rem]">
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-[320px] w-full object-cover md:h-[440px]"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <span>
                  {new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString(locale, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-border">/</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {post.readingMinutes} {copy.minRead}
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-3xl text-balance text-lg leading-8 text-muted-foreground">
                {post.metaDescription}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{copy.by} {post.authorName}</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-10">
                <BlogMarkdown content={post.bodyMarkdown} />
              </div>
            </div>

            <aside className="lg:pt-24">
              <div className="lg:sticky lg:top-28 p-1">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {copy.contents}
                </div>
                <div className="mt-4 space-y-3">
                  {headings.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {copy.quickRead}
                    </div>
                  ) : (
                    headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-sm transition hover:text-foreground ${
                          heading.level === 3
                            ? "pl-3 text-muted-foreground"
                            : "font-medium text-foreground/80"
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <section className="pb-8">
        <div className="overflow-hidden border-y border-primary/15 bg-[radial-gradient(85%_120%_at_10%_10%,hsl(var(--primary)/0.16),transparent_55%),linear-gradient(180deg,hsl(var(--primary)/0.06),transparent)]">
          <div className="container grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_300px] md:items-end md:py-16">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {copy.ctaEyebrow}
              </div>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                {copy.ctaTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                {copy.ctaBody}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  {copy.ctaPrimary}
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent/45"
                >
                  {copy.ctaSecondary}
                </Link>
              </div>
            </div>

            <div className="max-w-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary backdrop-blur">
                <Leaf className="h-3.5 w-3.5" />
                {copy.ctaImpactBadge}
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {copy.ctaImpact}
              </p>
            </div>
          </div>
        </div>
      </section>

      {relatedPosts.length > 0 && (
        <section className="container pb-20">
          <div className="px-1 py-8 md:px-0">
            <h2 className="text-2xl font-semibold tracking-tight">{copy.more}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedPosts.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/blog/${entry.slug}`}
                  className="group rounded-[1.5rem] p-1 transition hover:bg-background"
                >
                  {entry.coverImageUrl ? (
                    <div className="overflow-hidden rounded-[1.25rem]">
                      <img
                        src={entry.coverImageUrl}
                        alt={entry.title}
                        className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}
                  <div className="px-4 pt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {new Date(entry.publishedAt ?? entry.updatedAt).toLocaleDateString(
                        locale,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </div>
                    <div className="mt-3 text-lg font-semibold tracking-tight">
                      {entry.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {entry.excerpt}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium group-hover:text-primary">
                      {copy.readNext}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />

      <Script id={`blog-post-jsonld-${post.slug}`} type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>
    </>
  );
}
