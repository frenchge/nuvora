"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "convex/react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { api } from "@convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOG_BODY_TEMPLATE,
  BLOG_LOCALE_LABELS,
  BLOG_LOCALES,
  normalizeBlogSlug,
  type BlogLocale,
} from "@/lib/blog";
import { getLocalizedPath } from "@/lib/site";
import { cn } from "@/lib/utils";

type BlogTranslationFields = {
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  bodyMarkdown: string;
  tags: string[];
};

type BlogPostRow = {
  id: string;
  sourceLocale: string;
  status: string;
  slug: string;
  authorName: string;
  coverImageUrl: string;
  publishedAt: number | null;
  updatedAt: number;
  translations: Record<BlogLocale, BlogTranslationFields>;
  translatedLocales: string[];
};

type SharedFormState = {
  sourceLocale: BlogLocale;
  status: "draft" | "published";
  slug: string;
  authorName: string;
  coverImageUrl: string;
};

function emptyTranslation(seed = false): BlogTranslationFields {
  return {
    title: "",
    seoTitle: "",
    metaDescription: "",
    excerpt: "",
    bodyMarkdown: seed ? BLOG_BODY_TEMPLATE : "",
    tags: [],
  };
}

function createEmptyTranslations(sourceLocale: BlogLocale) {
  return Object.fromEntries(
    BLOG_LOCALES.map((locale) => [locale, emptyTranslation(locale === sourceLocale)]),
  ) as Record<BlogLocale, BlogTranslationFields>;
}

function toSharedState(post: BlogPostRow): SharedFormState {
  return {
    sourceLocale: post.sourceLocale as BlogLocale,
    status: post.status as "draft" | "published",
    slug: post.slug,
    authorName: post.authorName,
    coverImageUrl: post.coverImageUrl,
  };
}

function lengthTone(length: number, min: number, max: number) {
  if (length === 0) return "text-muted-foreground";
  if (length < min || length > max) return "text-amber-600 dark:text-amber-300";
  return "text-primary";
}

export function BlogManager({ initialPosts }: { initialPosts: BlogPostRow[] }) {
  const locale = useLocale() as BlogLocale;
  const upsertPost = useMutation(api.blog.upsert);
  const removePost = useMutation(api.blog.remove);
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState(initialPosts);
  const [selectedId, setSelectedId] = useState<string | null>(initialPosts[0]?.id ?? null);
  const [sharedForm, setSharedForm] = useState<SharedFormState>(
    initialPosts[0]
      ? toSharedState(initialPosts[0])
      : {
          sourceLocale: locale,
          status: "draft",
          slug: "",
          authorName: "Vercilio Team",
          coverImageUrl: "",
        },
  );
  const [translationDrafts, setTranslationDrafts] = useState<
    Record<BlogLocale, BlogTranslationFields>
  >(initialPosts[0] ? initialPosts[0].translations : createEmptyTranslations(locale));
  const [activeLocale, setActiveLocale] = useState<BlogLocale>(
    (initialPosts[0]?.sourceLocale as BlogLocale | undefined) ?? locale,
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPosts[0]));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId],
  );

  useEffect(() => {
    if (!selectedPost) return;
    setSharedForm(toSharedState(selectedPost));
    setTranslationDrafts(selectedPost.translations);
    setActiveLocale(selectedPost.sourceLocale as BlogLocale);
    setSlugTouched(true);
  }, [selectedPost]);

  const activeTranslation = translationDrafts[activeLocale];

  function updateShared<K extends keyof SharedFormState>(
    key: K,
    value: SharedFormState[K],
  ) {
    setSharedForm((current) => ({ ...current, [key]: value }));
  }

  function updateTranslation<K extends keyof BlogTranslationFields>(
    key: K,
    value: BlogTranslationFields[K],
  ) {
    setTranslationDrafts((current) => ({
      ...current,
      [activeLocale]: {
        ...current[activeLocale],
        [key]: value,
      },
    }));

    if (key === "title" && !slugTouched && activeLocale === sharedForm.sourceLocale) {
      setSharedForm((current) => ({
        ...current,
        slug: normalizeBlogSlug(String(value)),
      }));
    }
  }

  function createNew() {
    setSelectedId(null);
    setActiveLocale(locale);
    setSharedForm({
      sourceLocale: locale,
      status: "draft",
      slug: "",
      authorName: "Vercilio Team",
      coverImageUrl: "",
    });
    setTranslationDrafts(createEmptyTranslations(locale));
    setSlugTouched(false);
  }

  function savePost() {
    startTransition(async () => {
      try {
        const draft = translationDrafts[activeLocale];
        const saved = await upsertPost({
          postId: selectedId ? (selectedId as never) : undefined,
          sourceLocale: sharedForm.sourceLocale,
          locale: activeLocale,
          status: sharedForm.status,
          slug: sharedForm.slug,
          authorName: sharedForm.authorName || undefined,
          coverImageUrl: sharedForm.coverImageUrl || undefined,
          title: draft.title,
          seoTitle: draft.seoTitle || undefined,
          metaDescription: draft.metaDescription || undefined,
          excerpt: draft.excerpt || undefined,
          bodyMarkdown: draft.bodyMarkdown,
          tags: draft.tags,
        });

        setPosts((current) => {
          const next = current.filter((post) => post.id !== saved.id);
          next.unshift(saved);
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        });
        setSelectedId(saved.id);
        setSharedForm(toSharedState(saved));
        setTranslationDrafts(saved.translations);
        setActiveLocale(activeLocale);
        setSlugTouched(true);
      } catch (error) {
        setErrorMessage((error as Error).message);
      }
    });
  }

  function requestDeletePost() {
    if (!selectedId) return;
    setDeleteOpen(true);
  }

  function deletePost() {
    if (!selectedId) return;
    startTransition(async () => {
      try {
        await removePost({ postId: selectedId as never });
        const remaining = posts.filter((post) => post.id !== selectedId);
        setPosts(remaining);
        if (remaining[0]) {
          setSelectedId(remaining[0].id);
          setSharedForm(toSharedState(remaining[0]));
          setTranslationDrafts(remaining[0].translations);
          setActiveLocale(remaining[0].sourceLocale as BlogLocale);
          setSlugTouched(true);
        } else {
          setSelectedId(null);
          createNew();
        }
        setDeleteOpen(false);
      } catch (error) {
        setErrorMessage((error as Error).message);
      }
    });
  }

  const translatedCount = selectedPost?.translatedLocales.length ?? 1;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Blog publishing</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Each blog post can now carry multiple translations. Shared fields
            like slug, status, author, and cover image live once, while each
            locale gets its own title, SEO metadata, excerpt, tags, and body.
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
                    <span className="line-clamp-1 font-medium">
                      {post.translations[post.sourceLocale as BlogLocale].title ||
                        post.slug}
                    </span>
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
                  <div className="mt-1 text-xs text-muted-foreground">
                    {post.slug}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{translatedCount} translations</span>
                    <span>/</span>
                    <span>Source: {post.sourceLocale.toUpperCase()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border/60 bg-card/40 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Source language</span>
              <select
                value={sharedForm.sourceLocale}
                onChange={(event) => {
                  const nextLocale = event.target.value as BlogLocale;
                  updateShared("sourceLocale", nextLocale);
                  setActiveLocale(nextLocale);
                  setTranslationDrafts((current) => ({
                    ...current,
                    [nextLocale]:
                      current[nextLocale].bodyMarkdown || current[nextLocale].title
                        ? current[nextLocale]
                        : emptyTranslation(true),
                  }));
                }}
                disabled={Boolean(selectedPost)}
                className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm disabled:opacity-60"
              >
                {BLOG_LOCALES.map((entry) => (
                  <option key={entry} value={entry}>
                    {BLOG_LOCALE_LABELS[entry]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>
              <select
                value={sharedForm.status}
                onChange={(event) =>
                  updateShared("status", event.target.value as "draft" | "published")
                }
                className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Slug</span>
                <button
                  type="button"
                  onClick={() => {
                    setSlugTouched(false);
                    updateShared(
                      "slug",
                      normalizeBlogSlug(
                        translationDrafts[sharedForm.sourceLocale].title,
                      ),
                    );
                  }}
                  className="text-xs font-medium text-primary"
                >
                  Regenerate
                </button>
              </div>
              <Input
                value={sharedForm.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  updateShared("slug", normalizeBlogSlug(event.target.value));
                }}
                placeholder="choose-the-right-ai-model"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Author</span>
              <Input
                value={sharedForm.authorName}
                onChange={(event) => updateShared("authorName", event.target.value)}
                placeholder="Vercilio Team"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Cover image URL</span>
              <Input
                value={sharedForm.coverImageUrl}
                onChange={(event) =>
                  updateShared("coverImageUrl", event.target.value)
                }
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Translation editor
            </div>
            <div className="flex flex-wrap gap-2">
              {BLOG_LOCALES.map((entry) => {
                const hasContent =
                  translationDrafts[entry].title.trim().length > 0 &&
                  translationDrafts[entry].bodyMarkdown.trim().length > 0;
                return (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setActiveLocale(entry)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      activeLocale === entry
                        ? "border-primary/35 bg-primary/10 text-primary"
                        : "border-border/60 bg-background/70 text-muted-foreground hover:border-primary/20 hover:text-foreground",
                    )}
                  >
                    {BLOG_LOCALE_LABELS[entry]}
                    {entry === sharedForm.sourceLocale ? " (Source)" : ""}
                    {hasContent ? " *" : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-background/45 p-4">
            <div className="text-sm font-medium">
              Editing {BLOG_LOCALE_LABELS[activeLocale]}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Post title</span>
                <Input
                  value={activeTranslation.title}
                  onChange={(event) => updateTranslation("title", event.target.value)}
                  placeholder="How to choose the right AI model for your team"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">SEO title</span>
                  <span
                    className={cn(
                      "text-xs",
                      lengthTone(activeTranslation.seoTitle.length, 45, 70),
                    )}
                  >
                    {activeTranslation.seoTitle.length || activeTranslation.title.length} / 45-70 chars
                  </span>
                </div>
                <Input
                  value={activeTranslation.seoTitle}
                  onChange={(event) =>
                    updateTranslation("seoTitle", event.target.value)
                  }
                  placeholder="Best AI models for teams in 2026 | Vercilio"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Meta description</span>
                  <span
                    className={cn(
                      "text-xs",
                      lengthTone(activeTranslation.metaDescription.length, 140, 160),
                    )}
                  >
                    {activeTranslation.metaDescription.length} / 140-160 chars
                  </span>
                </div>
                <Textarea
                  value={activeTranslation.metaDescription}
                  onChange={(event) =>
                    updateTranslation("metaDescription", event.target.value)
                  }
                  className="min-h-[92px]"
                  placeholder="What the article covers, why it matters, and the result the reader should expect."
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Excerpt</span>
                  <span
                    className={cn(
                      "text-xs",
                      lengthTone(activeTranslation.excerpt.length, 110, 180),
                    )}
                  >
                    {activeTranslation.excerpt.length} / 110-180 chars
                  </span>
                </div>
                <Textarea
                  value={activeTranslation.excerpt}
                  onChange={(event) => updateTranslation("excerpt", event.target.value)}
                  className="min-h-[92px]"
                  placeholder="A short summary for cards, previews, and social snippets."
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Tags</span>
                <Input
                  value={activeTranslation.tags.join(", ")}
                  onChange={(event) =>
                    updateTranslation(
                      "tags",
                      event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="ai models, prompt engineering, team workflows"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Body (Markdown)</span>
                <Textarea
                  value={activeTranslation.bodyMarkdown}
                  onChange={(event) =>
                    updateTranslation("bodyMarkdown", event.target.value)
                  }
                  className="min-h-[420px] font-mono text-[13px] leading-6"
                  placeholder="Use H2s, H3s, bullet lists, and short paragraphs."
                />
              </label>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border/60 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
            SEO checklist:
            Keep one clear topic per post, use the page title as the only H1,
            start the body with `##` headings, and localize the excerpt, tags,
            and metadata for each language instead of copying the source text.
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={savePost} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {sharedForm.status === "published"
                ? `Save ${BLOG_LOCALE_LABELS[activeLocale]} translation`
                : `Save ${BLOG_LOCALE_LABELS[activeLocale]} draft`}
            </Button>

            {selectedPost && (
              <Button
                type="button"
                variant="outline"
                onClick={requestDeletePost}
                disabled={isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}

            {selectedPost?.status === "published" && (
              <a
                href={getLocalizedPath(activeLocale, `/blog/${selectedPost.slug}`)}
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

      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
            <div className="border-b border-border/50 bg-[linear-gradient(180deg,rgba(255,94,94,0.09),rgba(255,94,94,0))] px-6 py-5 md:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-xl font-semibold tracking-tight">
                    Delete this blog post?
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                    This will permanently remove the post, all translations, and
                    its SEO content. This action cannot be undone.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <div className="space-y-5 px-6 py-6 md:px-7">
              <div className="rounded-2xl border border-border/60 bg-secondary/40 px-4 py-3 text-sm leading-6 text-foreground/80">
                {selectedPost
                  ? `You are deleting "${selectedPost.translations[selectedPost.sourceLocale as BlogLocale].title || selectedPost.slug}".`
                  : "This post will be deleted permanently."}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <Button variant="outline" className="rounded-xl" disabled={isPending}>
                    Keep post
                  </Button>
                </Dialog.Close>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  disabled={isPending}
                  onClick={deletePost}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete permanently
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={Boolean(errorMessage)}
        onOpenChange={(open) => {
          if (!open) setErrorMessage(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[82] bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[83] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
            <div className="border-b border-border/50 bg-[linear-gradient(180deg,rgba(255,94,94,0.09),rgba(255,94,94,0))] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-xl font-semibold tracking-tight">
                    Action couldn&apos;t be completed
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                    {errorMessage}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <div className="flex justify-end px-6 py-5">
              <Dialog.Close asChild>
                <Button className="rounded-xl">Close</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
