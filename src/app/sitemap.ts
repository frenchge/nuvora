import type { MetadataRoute } from "next";
import { api } from "@convex/_generated/api";
import { fetchQuery } from "@/lib/convex-server";
import { routing, type Locale } from "@/i18n/routing";
import { getAbsoluteUrl } from "@/lib/site";

const MARKETING_PATHS = [
  "/",
  "/blog",
  "/models",
  "/pricing",
  "/impact",
  "/about",
  "/contact",
  "/faq",
] as const;

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
    })),
  );

  const posts = await fetchQuery(api.blog.listPublishedForSitemap, {});
  const blogPages = routing.locales.flatMap((locale) =>
    posts.map((post) => ({
      url: getAbsoluteUrl(locale as Locale, `/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  );

  return [...pages, ...blogPages];
}
