import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./helpers";
import {
  deriveExcerpt,
  estimateReadingMinutes,
  normalizeBlogSlug,
  normalizeBlogTags,
} from "../src/lib/blog";

const blogLocaleValidator = v.union(v.literal("en"), v.literal("fr"));
const blogStatusValidator = v.union(v.literal("draft"), v.literal("published"));

function serializePost(post: Doc<"blog_posts">) {
  return {
    id: String(post._id),
    locale: post.locale,
    status: post.status,
    slug: post.slug,
    title: post.title,
    seoTitle: post.seo_title,
    metaDescription: post.meta_description,
    excerpt: post.excerpt,
    bodyMarkdown: post.body_markdown,
    authorName: post.author_name,
    tags: post.tags,
    coverImageUrl: post.cover_image_url ?? "",
    publishedAt: post.published_at ?? null,
    updatedAt: post.updated_at,
    readingMinutes: estimateReadingMinutes(post.body_markdown),
  };
}

async function getPostByLocaleAndSlug(ctx: QueryCtx, locale: string, slug: string) {
  return await ctx.db
    .query("blog_posts")
    .withIndex("by_locale_and_slug", (q) => q.eq("locale", locale).eq("slug", slug))
    .unique();
}

export const listPublishedByLocale = query({
  args: {
    locale: blogLocaleValidator,
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("blog_posts")
      .withIndex("by_locale_and_status_and_published_at", (q) =>
        q.eq("locale", args.locale).eq("status", "published"),
      )
      .order("desc")
      .collect();

    return rows.map(serializePost);
  },
});

export const getPublishedBySlug = query({
  args: {
    locale: blogLocaleValidator,
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await getPostByLocaleAndSlug(
      ctx,
      args.locale,
      normalizeBlogSlug(args.slug),
    );
    if (!row || row.status !== "published") {
      return null;
    }

    return serializePost(row);
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("blog_posts").collect();
    return rows.sort((a, b) => b.updated_at - a.updated_at).map(serializePost);
  },
});

export const listPublishedForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("blog_posts")
      .collect();

    return rows
      .filter((row) => row.status === "published" && row.published_at)
      .sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0))
      .map((row) => ({
        locale: row.locale,
        slug: row.slug,
        updatedAt: row.updated_at,
        publishedAt: row.published_at ?? row.updated_at,
      }));
  },
});

export const upsert = mutation({
  args: {
    postId: v.optional(v.id("blog_posts")),
    locale: blogLocaleValidator,
    status: blogStatusValidator,
    title: v.string(),
    slug: v.string(),
    seoTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    bodyMarkdown: v.string(),
    authorName: v.optional(v.string()),
    tags: v.array(v.string()),
    coverImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const title = args.title.trim();
    const bodyMarkdown = args.bodyMarkdown.trim();
    const slug = normalizeBlogSlug(args.slug || title);
    const excerpt = (args.excerpt?.trim() || deriveExcerpt(bodyMarkdown, 180)).slice(
      0,
      220,
    );
    const seoTitle = (args.seoTitle?.trim() || title).slice(0, 80);
    const metaDescription = (
      args.metaDescription?.trim() || excerpt || deriveExcerpt(bodyMarkdown)
    ).slice(0, 180);
    const authorName = args.authorName?.trim() || "Vercilio Team";
    const coverImageUrl = args.coverImageUrl?.trim() || undefined;
    const tags = normalizeBlogTags(args.tags);
    const now = Date.now();

    if (!title) {
      throw new Error("Title is required");
    }
    if (!bodyMarkdown) {
      throw new Error("Post body is required");
    }

    const existingWithSlug = await ctx.db
      .query("blog_posts")
      .withIndex("by_locale_and_slug", (q) =>
        q.eq("locale", args.locale).eq("slug", slug),
      )
      .unique();

    if (existingWithSlug && existingWithSlug._id !== args.postId) {
      throw new Error("A post with this slug already exists for that locale");
    }

    const existing = args.postId ? await ctx.db.get(args.postId) : null;
    const publishedAt =
      args.status === "published"
        ? existing?.published_at ?? now
        : undefined;

    const payload = {
      locale: args.locale,
      status: args.status,
      slug,
      title,
      seo_title: seoTitle,
      meta_description: metaDescription,
      excerpt,
      body_markdown: bodyMarkdown,
      author_name: authorName,
      tags,
      cover_image_url: coverImageUrl,
      published_at: publishedAt,
      updated_at: now,
    };

    const postId: Id<"blog_posts"> = args.postId
      ? args.postId
      : await ctx.db.insert("blog_posts", payload);

    if (args.postId) {
      await ctx.db.patch(args.postId, payload);
    }

    const saved = await ctx.db.get(postId);
    if (!saved) {
      throw new Error("Blog post could not be saved");
    }

    return serializePost(saved);
  },
});

export const remove = mutation({
  args: {
    postId: v.id("blog_posts"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.postId);
    return null;
  },
});
