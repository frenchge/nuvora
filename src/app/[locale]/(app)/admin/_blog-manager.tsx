"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { api } from "@convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BLOG_BODY_TEMPLATE, normalizeBlogSlug } from "@/lib/blog";
import { getLocalizedPath } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

type BlogPostRow = {
  id: string;
  status: string;
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  bodyMarkdown: string;
  authorName: string;
  tags: string[];
  coverImageUrl: string;
  publishedAt: number | null;
  updatedAt: number;
  readingMinutes: number;
};

type BlogFormState = {
  status: "draft" | "published";
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  authorName: string;
  coverImageUrl: string;
  tagsText: string;
  bodyMarkdown: string;
};

function emptyForm(): BlogFormState {
  return {
    status: "draft",
    title: "",
    slug: "",
    seoTitle: "",
    metaDescription: "",
    excerpt: "",
    authorName: "Vercilio Team",
    coverImageUrl: "",
    tagsText: "",
    bodyMarkdown: BLOG_BODY_TEMPLATE,
  };
}

function toFormState(post: BlogPostRow): BlogFormState {
  return {
    status: post.status as "draft" | "published",
    title: post.title,
    slug: post.slug,
    seoTitle: post.seoTitle,
    metaDescription: post.metaDescription,
    excerpt: post.excerpt,
    authorName: post.authorName,
    coverImageUrl: post.coverImageUrl,
    tagsText: post.tags.join(", "),
    bodyMarkdown: post.bodyMarkdown,
  };
}

function lengthTone(length: number, min: number, max: number) {
  if (length === 0) return "text-muted-foreground";
  if (length < min || length > max) return "text-amber-600 dark:text-amber-300";
  return "text-primary";
}

export function BlogManager({ initialPosts }: { initialPosts: BlogPostRow[] }) {
  const currentLocale = useLocale() as Locale;
  const upsertPost = useMutation(api.blog.upsert);
  const removePost = useMutation(api.blog.remove);
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState(initialPosts);
  const [selectedId, setSelectedId] = useState<string | null>(initialPosts[0]?.id ?? null);
  const [form, setForm] = useState<BlogFormState>(
    initialPosts[0] ? toFormState(initialPosts[0]) : emptyForm(),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPosts[0]));

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId],
  );

  useEffect(() => {
    if (!selectedPost) return;
    setForm(toFormState(selectedPost));
    setSlugTouched(true);
  }, [selectedPost]);

  function updateForm<K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !slugTouched) {
        next.slug = normalizeBlogSlug(String(value));
      }
      return next;
    });
  }

  function createNew() {
    setSelectedId(null);
    setForm(emptyForm());
    setSlugTouched(false);
  }

  function savePost() {
    startTransition(async () => {
      try {
        const saved = await upsertPost({
          postId: selectedId ? (selectedId as never) : undefined,
          status: form.status,
          title: form.title,
          slug: form.slug,
          seoTitle: form.seoTitle || undefined,
          metaDescription: form.metaDescription || undefined,
          excerpt: form.excerpt || undefined,
          bodyMarkdown: form.bodyMarkdown,
          authorName: form.authorName || undefined,
          coverImageUrl: form.coverImageUrl || undefined,
          tags: form.tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        });

        setPosts((current) => {
          const next = current.filter((post) => post.id !== saved.id);
          next.unshift(saved);
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        });
        setSelectedId(saved.id);
        setForm(toFormState(saved));
        setSlugTouched(true);
      } catch (error) {
        alert((error as Error).message);
      }
    });
  }

  function deletePost() {
    if (!selectedId) return;
    if (!window.confirm("Delete this blog post? This cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await removePost({ postId: selectedId as never });
        const remaining = posts.filter((post) => post.id !== selectedId);
        setPosts(remaining);
        setSelectedId(remaining[0]?.id ?? null);
        setForm(remaining[0] ? toFormState(remaining[0]) : emptyForm());
        setSlugTouched(Boolean(remaining[0]));
      } catch (error) {
        alert((error as Error).message);
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Blog publishing</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The form below is intentionally structured for SEO: separate slug,
            search title, meta description, excerpt, tags, and body.
            If you leave some fields blank, the backend fills sensible defaults
            from the post title and content before saving.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={createNew}>
          <Plus className="mr-2 h-4 w-4" />
          New post
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-[1.75rem] border border-border/60 bg-card/40 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Existing posts
          </div>
          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                No blog posts yet.
              </div>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left transition",
                    selectedId === post.id
                      ? "border-primary/35 bg-primary/8"
                      : "border-border/60 bg-background/60 hover:border-primary/20 hover:bg-background",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 font-medium">{post.title}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-full capitalize",
                        post.status === "published" && "bg-primary/10 text-primary",
                      )}
                    >
                      {post.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{post.slug}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(post.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border/60 bg-card/40 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    "status",
                    event.target.value as "draft" | "published",
                  )
                }
                className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Post title</span>
              <Input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="How to choose the right AI model for your team"
              />
            </label>

            <label className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Slug</span>
                <button
                  type="button"
                  onClick={() => {
                    setSlugTouched(false);
                    updateForm("slug", normalizeBlogSlug(form.title));
                  }}
                  className="text-xs font-medium text-primary"
                >
                  Regenerate
                </button>
              </div>
              <Input
                value={form.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  updateForm("slug", normalizeBlogSlug(event.target.value));
                }}
                placeholder="choose-the-right-ai-model"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Author</span>
              <Input
                value={form.authorName}
                onChange={(event) =>
                  updateForm("authorName", event.target.value)
                }
                placeholder="Vercilio Team"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">SEO title</span>
                <span className={cn("text-xs", lengthTone(form.seoTitle.length, 45, 70))}>
                  {form.seoTitle.length || form.title.length} / 45-70 chars
                </span>
              </div>
              <Input
                value={form.seoTitle}
                onChange={(event) => updateForm("seoTitle", event.target.value)}
                placeholder="Best AI models for teams in 2026 | Vercilio"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Meta description</span>
                <span
                  className={cn(
                    "text-xs",
                    lengthTone(form.metaDescription.length, 140, 160),
                  )}
                >
                  {form.metaDescription.length} / 140-160 chars
                </span>
              </div>
              <Textarea
                value={form.metaDescription}
                onChange={(event) =>
                  updateForm("metaDescription", event.target.value)
                }
                className="min-h-[92px]"
                placeholder="What the article covers, why it matters, and the result the reader should expect."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Excerpt</span>
                <span className={cn("text-xs", lengthTone(form.excerpt.length, 110, 180))}>
                  {form.excerpt.length} / 110-180 chars
                </span>
              </div>
              <Textarea
                value={form.excerpt}
                onChange={(event) => updateForm("excerpt", event.target.value)}
                className="min-h-[92px]"
                placeholder="A short summary for cards, previews, and social snippets."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Tags</span>
              <Input
                value={form.tagsText}
                onChange={(event) => updateForm("tagsText", event.target.value)}
                placeholder="ai models, prompt engineering, team workflows"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Cover image URL</span>
              <Input
                value={form.coverImageUrl}
                onChange={(event) =>
                  updateForm("coverImageUrl", event.target.value)
                }
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Body (Markdown)</span>
              <Textarea
                value={form.bodyMarkdown}
                onChange={(event) =>
                  updateForm("bodyMarkdown", event.target.value)
                }
                className="min-h-[420px] font-mono text-[13px] leading-6"
                placeholder="Use H2s, H3s, bullet lists, and short paragraphs."
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
            SEO checklist:
            Keep one clear topic per post, use the page title as the only H1,
            start the body with `##` headings, and include internal links to
            pricing, models, impact, or relevant posts when they help the
            reader.
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={savePost} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {form.status === "published" ? "Save published post" : "Save draft"}
            </Button>

            {selectedPost && (
              <Button
                type="button"
                variant="outline"
                onClick={deletePost}
                disabled={isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}

            {selectedPost?.status === "published" && (
              <a
                href={getLocalizedPath(
                  currentLocale,
                  `/blog/${selectedPost.slug}`,
                )}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary"
              >
                View live post
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
