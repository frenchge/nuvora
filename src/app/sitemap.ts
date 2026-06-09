import type { MetadataRoute } from "next";
import { api } from "@convex/_generated/api";
import { fetchQuery } from "@/lib/convex-server";
import { routing, type Locale } from "@/i18n/routing";
import { getAbsoluteUrl, getLocaleAlternates } from "@/lib/site";
import { CAREER_ROLES } from "@/lib/careers";

// Regenerate every hour so newly published blog posts get crawled within
// an hour instead of waiting for a redeploy.
export const revalidate = 3600;

const MARKETING_PATHS = [
  "/",
  "/blog",
  "/models",
  "/pricing",
  "/impact",
  "/about",
  "/careers",
  "/contact",
  "/faq",
] as const;

// Static legal routes also belong in the sitemap, but they don't change
// often — separate priority pool so they don't outrank marketing pages.
const LEGAL_PATHS = ["/legal/terms", "/legal/privacy", "/legal/cookies"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = routing.locales.flatMap((locale) =>
    MARKETING_PATHS.map((path) => ({
      url: getAbsoluteUrl(locale as Locale, path),
      lastModified: now,
      changeFrequency:
        path === "/" || path === "/blog"
          ? ("weekly" as const)
          : ("monthly" as const),
      priority: path === "/" ? 1 : path === "/blog" ? 0.9 : 0.8,
      alternates: {
        languages: getLocaleAlternates(path),
      },
    })),
  );

  // Individual job listings. They're indexable and only otherwise reachable
  // via internal links from /careers, which leaves them stuck in "Discovered
  // – currently not indexed". Listing them (with hreflang) gives Google a
  // direct discovery path for every locale variant.
  const careerPages = routing.locales.flatMap((locale) =>
    CAREER_ROLES.map((role) => ({
      url: getAbsoluteUrl(locale as Locale, `/careers/${role.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: { languages: getLocaleAlternates(`/careers/${role.slug}`) },
    })),
  );

  const legalPages = routing.locales.flatMap((locale) =>
    LEGAL_PATHS.map((path) => ({
      url: getAbsoluteUrl(locale as Locale, path),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
      alternates: { languages: getLocaleAlternates(path) },
    })),
  );

  // Blog posts come from Convex. If Convex is unreachable at build/serve
  // time (e.g. NEXT_PUBLIC_CONVEX_URL missing during a preview build), we
  // still want to serve a valid sitemap with at least the static surface
  // rather than failing the whole route.
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchQuery(api.blog.listPublishedForSitemap, {});
    blogPages = posts.flatMap((post) =>
      post.availableLocales.map((locale) => ({
        url: getAbsoluteUrl(locale as Locale, `/blog/${post.slug}`),
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.85,
        alternates: {
          languages: getLocaleAlternates(
            `/blog/${post.slug}`,
            post.availableLocales as readonly Locale[],
            post.availableLocales.includes(routing.defaultLocale)
              ? routing.defaultLocale
              : (post.availableLocales[0] as Locale),
          ),
        },
        images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      })),
    );
  } catch (error) {
    console.error("[sitemap] Failed to load blog posts", error);
  }

  return [...pages, ...careerPages, ...legalPages, ...blogPages];
}
