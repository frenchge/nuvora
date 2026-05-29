import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
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
    more: "More from the blog",
    quickRead: "This article is a quick read with no section jumps.",
    readNext: "Read next",
    blogName: "Blog",
  },
  fr: {
    back: "Retour au blog",
    minRead: "min de lecture",
    contents: "Sur cette page",
    more: "À lire aussi",
    quickRead: "Cet article est court et ne comporte pas de sections de navigation.",
    readNext: "Lire ensuite",
    blogName: "Blog",
  },
} as const;

async function getBlogPost(locale: Locale, slug: string) {
  return await fetchQuery(api.blog.getPublishedBySlug, { locale, slug });
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

  const allPosts = await fetchQuery(api.blog.listPublishedByLocale, {
    locale: typedLocale,
  });
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
                <span>By {post.authorName}</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-10 rounded-[2rem] border border-border/60 bg-card/55 px-6 py-8 md:px-10 md:py-10">
                <BlogMarkdown content={post.bodyMarkdown} />
              </div>
            </div>

            <aside className="lg:pt-24">
              <div className="lg:sticky lg:top-28 rounded-[1.75rem] border border-border/60 bg-card/55 p-5">
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

      {relatedPosts.length > 0 && (
        <section className="container pb-20">
          <div className="rounded-[2rem] border border-border/60 bg-secondary/35 px-6 py-8 md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight">{copy.more}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedPosts.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/blog/${entry.slug}`}
                  className="group rounded-[1.5rem] border border-border/60 bg-background/80 p-5 transition hover:border-primary/30 hover:bg-background"
                >
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
