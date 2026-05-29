import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./helpers";
import {
  BLOG_LOCALES,
  deriveExcerpt,
  estimateReadingMinutes,
  normalizeBlogSlug,
  normalizeBlogTags,
  type BlogLocale,
} from "../src/lib/blog";

const blogLocaleValidator = v.union(
  v.literal("en"),
  v.literal("fr"),
  v.literal("es"),
  v.literal("de"),
  v.literal("it"),
  v.literal("pt"),
);
const blogStatusValidator = v.union(v.literal("draft"), v.literal("published"));

type TranslationDoc = Doc<"blog_post_translations">;
type TranslationFields = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  bodyMarkdown: string;
  tags: string[];
};

function serializeTranslation(
  post: Doc<"blog_posts">,
  locale: BlogLocale,
  translation?: TranslationDoc | null,
) {
  const bodyMarkdown = translation?.body_markdown ?? post.body_markdown;
  return {
    id: String(post._id),
    sourceLocale: post.locale,
    locale,
    status: post.status,
    slug: post.slug,
    title: translation?.title ?? post.title,
    seoTitle: translation?.seo_title ?? post.seo_title,
    metaDescription: translation?.meta_description ?? post.meta_description,
    excerpt: translation?.excerpt ?? post.excerpt,
    bodyMarkdown,
    authorName: post.author_name,
    tags: translation?.tags ?? post.tags,
    coverImageUrl: post.cover_image_url ?? "",
    publishedAt: post.published_at ?? null,
    updatedAt: Math.max(post.updated_at, translation?.updated_at ?? 0),
    readingMinutes: estimateReadingMinutes(bodyMarkdown),
    isFallback: !translation && locale !== post.locale,
  };
}

function emptyTranslation() {
  return {
    title: "",
    seoTitle: "",
    metaDescription: "",
    excerpt: "",
    bodyMarkdown: "",
    tags: [] as string[],
  };
}

function buildTranslationsMap(
  post: Doc<"blog_posts">,
  postTranslations: TranslationDoc[],
) {
  const byLocale = Object.fromEntries(
    BLOG_LOCALES.map((locale) => [locale, emptyTranslation()]),
  ) as Record<BlogLocale, TranslationFields>;

  byLocale[post.locale as BlogLocale] = {
    title: post.title,
    seoTitle: post.seo_title,
    metaDescription: post.meta_description,
    excerpt: post.excerpt,
    bodyMarkdown: post.body_markdown,
    tags: post.tags,
  };

  for (const translation of postTranslations) {
    byLocale[translation.locale as BlogLocale] = {
      title: translation.title,
      seoTitle: translation.seo_title,
      metaDescription: translation.meta_description,
      excerpt: translation.excerpt,
      bodyMarkdown: translation.body_markdown,
      tags: translation.tags,
    };
  }

  return byLocale;
}

function serializeAdminPost(
  post: Doc<"blog_posts">,
  postTranslations: TranslationDoc[],
) {
  const translations = buildTranslationsMap(post, postTranslations);

  return {
    id: String(post._id),
    sourceLocale: post.locale,
    status: post.status,
    slug: post.slug,
    authorName: post.author_name,
    coverImageUrl: post.cover_image_url ?? "",
    publishedAt: post.published_at ?? null,
    updatedAt: post.updated_at,
    translations,
    translatedLocales: BLOG_LOCALES.filter((locale) => {
      const value = translations[locale];
      return value.title.trim().length > 0 && value.bodyMarkdown.trim().length > 0;
    }),
  };
}

function normalizeTranslationFromInput(args: {
  title: string;
  seoTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  bodyMarkdown: string;
  tags: string[];
}) {
  const title = args.title.trim();
  const bodyMarkdown = args.bodyMarkdown.trim();
  const excerpt = (args.excerpt?.trim() || deriveExcerpt(bodyMarkdown, 180)).slice(
    0,
    220,
  );
  const seoTitle = (args.seoTitle?.trim() || title).slice(0, 80);
  const metaDescription = (
    args.metaDescription?.trim() || excerpt || deriveExcerpt(bodyMarkdown)
  ).slice(0, 180);
  const tags = normalizeBlogTags(args.tags);

  if (!title) {
    throw new Error("Title is required");
  }
  if (!bodyMarkdown) {
    throw new Error("Post body is required");
  }

  return {
    title,
    seoTitle,
    metaDescription,
    excerpt,
    bodyMarkdown,
    tags,
  };
}

export const listPublished = query({
  args: {
    locale: blogLocaleValidator,
  },
  handler: async (ctx, args) => {
    const [posts, translations] = await Promise.all([
      ctx.db
        .query("blog_posts")
        .withIndex("by_status_and_published_at", (q) => q.eq("status", "published"))
        .order("desc")
        .collect(),
      ctx.db.query("blog_post_translations").collect(),
    ]);

    const translationsByKey = new Map<string, TranslationDoc>();
    for (const translation of translations) {
      translationsByKey.set(
        `${String(translation.post_id)}:${translation.locale}`,
        translation,
      );
    }

    return posts.map((post) =>
      serializeTranslation(
        post,
        args.locale,
        translationsByKey.get(`${String(post._id)}:${args.locale}`) ?? null,
      ),
    );
  },
});

export const getPublishedBySlug = query({
  args: {
    locale: blogLocaleValidator,
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const slug = normalizeBlogSlug(args.slug);
    const post = await ctx.db
      .query("blog_posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!post || post.status !== "published") {
      return null;
    }

    const translation =
      args.locale === post.locale
        ? null
        : await ctx.db
            .query("blog_post_translations")
            .withIndex("by_post_id_and_locale", (q) =>
              q.eq("post_id", post._id).eq("locale", args.locale),
            )
            .unique();

    return serializeTranslation(post, args.locale, translation);
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [posts, translations] = await Promise.all([
      ctx.db.query("blog_posts").collect(),
      ctx.db.query("blog_post_translations").collect(),
    ]);

    const translationsByPost = new Map<Id<"blog_posts">, TranslationDoc[]>();
    for (const translation of translations) {
      const existing = translationsByPost.get(translation.post_id) ?? [];
      existing.push(translation);
      translationsByPost.set(translation.post_id, existing);
    }

    return posts
      .sort((a, b) => b.updated_at - a.updated_at)
      .map((post) => serializeAdminPost(post, translationsByPost.get(post._id) ?? []));
  },
});

export const listPublishedForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("blog_posts")
      .withIndex("by_status_and_published_at", (q) => q.eq("status", "published"))
      .collect();

    return rows
      .filter((row) => row.published_at)
      .sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0))
      .map((row) => ({
        slug: row.slug,
        updatedAt: row.updated_at,
        publishedAt: row.published_at ?? row.updated_at,
      }));
  },
});

export const upsert = mutation({
  args: {
    postId: v.optional(v.id("blog_posts")),
    sourceLocale: blogLocaleValidator,
    locale: blogLocaleValidator,
    status: blogStatusValidator,
    slug: v.string(),
    authorName: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    title: v.string(),
    seoTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    bodyMarkdown: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const translation = normalizeTranslationFromInput(args);
    const slug = normalizeBlogSlug(args.slug || translation.title);
    const authorName = args.authorName?.trim() || "Vercilio Team";
    const coverImageUrl = args.coverImageUrl?.trim() || undefined;
    const now = Date.now();

    const existingWithSlug = await ctx.db
      .query("blog_posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existingWithSlug && existingWithSlug._id !== args.postId) {
      throw new Error("A post with this slug already exists");
    }

    const existing = args.postId ? await ctx.db.get(args.postId) : null;
    const baseLocale = (existing?.locale ?? args.sourceLocale) as BlogLocale;

    if (!existing && args.locale !== baseLocale) {
      throw new Error("Create the source translation first before saving another language");
    }

    if (!existing) {
      const postId = await ctx.db.insert("blog_posts", {
        locale: baseLocale,
        status: args.status,
        slug,
        title: translation.title,
        seo_title: translation.seoTitle,
        meta_description: translation.metaDescription,
        excerpt: translation.excerpt,
        body_markdown: translation.bodyMarkdown,
        author_name: authorName,
        tags: translation.tags,
        cover_image_url: coverImageUrl,
        published_at: args.status === "published" ? now : undefined,
        updated_at: now,
      });

      const saved = await ctx.db.get(postId);
      if (!saved) throw new Error("Blog post could not be saved");
      return serializeAdminPost(saved, []);
    }

    await ctx.db.patch(existing._id, {
      status: args.status,
      slug,
      author_name: authorName,
      cover_image_url: coverImageUrl,
      published_at:
        args.status === "published"
          ? existing.published_at ?? now
          : undefined,
      updated_at: now,
      ...(args.locale === baseLocale
        ? {
            title: translation.title,
            seo_title: translation.seoTitle,
            meta_description: translation.metaDescription,
            excerpt: translation.excerpt,
            body_markdown: translation.bodyMarkdown,
            tags: translation.tags,
          }
        : {}),
    });

    if (args.locale !== baseLocale) {
      const existingTranslation = await ctx.db
        .query("blog_post_translations")
        .withIndex("by_post_id_and_locale", (q) =>
          q.eq("post_id", existing._id).eq("locale", args.locale),
        )
        .unique();

      if (existingTranslation) {
        await ctx.db.patch(existingTranslation._id, {
          title: translation.title,
          seo_title: translation.seoTitle,
          meta_description: translation.metaDescription,
          excerpt: translation.excerpt,
          body_markdown: translation.bodyMarkdown,
          tags: translation.tags,
          updated_at: now,
        });
      } else {
        await ctx.db.insert("blog_post_translations", {
          post_id: existing._id,
          locale: args.locale,
          title: translation.title,
          seo_title: translation.seoTitle,
          meta_description: translation.metaDescription,
          excerpt: translation.excerpt,
          body_markdown: translation.bodyMarkdown,
          tags: translation.tags,
          updated_at: now,
        });
      }
    }

    const [savedPost, savedTranslations] = await Promise.all([
      ctx.db.get(existing._id),
      ctx.db
        .query("blog_post_translations")
        .withIndex("by_post_id_and_locale", (q) => q.eq("post_id", existing._id))
        .collect(),
    ]);

    if (!savedPost) {
      throw new Error("Blog post could not be saved");
    }

    return serializeAdminPost(savedPost, savedTranslations);
  },
});

export const remove = mutation({
  args: {
    postId: v.id("blog_posts"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const translations = await ctx.db
      .query("blog_post_translations")
      .withIndex("by_post_id_and_locale", (q) => q.eq("post_id", args.postId))
      .collect();

    for (const translation of translations) {
      await ctx.db.delete(translation._id);
    }

    await ctx.db.delete(args.postId);
    return null;
  },
});
