export const BLOG_LOCALES = ["en", "fr"] as const;
export type BlogLocale = (typeof BLOG_LOCALES)[number];

export type BlogHeading = {
  id: string;
  level: 2 | 3;
  text: string;
};

export const BLOG_BODY_TEMPLATE = `## Why this matters

Open with 2-3 sentences that clearly explain the problem, question, or trend this post answers.

## What you'll learn

- Point one
- Point two
- Point three

## Key details

Add the main explanation here. Use short paragraphs, bullet lists, and clear subheads.

### Practical takeaway

Share the one concrete action, workflow, or insight readers should remember.

## Final thought

Close with a short summary or next step.`;

export function normalizeBlogSlug(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "untitled-post";
}

export function normalizeBlogTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const value = tag.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized.slice(0, 12);
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveExcerpt(markdown: string, maxLength = 160): string {
  const plain = stripMarkdown(markdown);
  if (plain.length <= maxLength) return plain;

  const clipped = plain.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 80 ? lastSpace : maxLength).trim()}...`;
}

export function estimateReadingMinutes(markdown: string): number {
  const words = stripMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function headingIdFromText(text: string): string {
  return normalizeBlogSlug(text);
}

export function extractBlogHeadings(markdown: string): BlogHeading[] {
  const headings: BlogHeading[] = [];

  for (const line of markdown.split("\n")) {
    const match = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const level = match[1] === "##" ? 2 : 3;
    const text = match[2].trim();
    if (!text) continue;

    headings.push({
      id: headingIdFromText(text),
      level,
      text,
    });
  }

  return headings;
}
