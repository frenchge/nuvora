/**
 * Provider metadata for the model selector and chat UI.
 *
 * Logos:
 *   - SimpleIcons CDN (`cdn.simpleicons.org/<slug>/black`) when the brand is on
 *     SimpleIcons. We render in black and use `dark:invert` to flip to white.
 *   - Local monochrome SVGs in `/public/providers/*.svg` for brands SimpleIcons
 *     doesn't carry (OpenAI, Cohere, Microsoft, Amazon). Same `dark:invert` flip.
 *
 * If you add a model from a provider that isn't listed here, it falls back
 * to a 2-letter glyph badge — still readable, but add an entry for polish.
 */

const si = (slug: string): string => `https://cdn.simpleicons.org/${slug}/black`;
const local = (file: string): string => `/providers/${file}.svg`;

export const POPULAR_PROVIDER_ORDER = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Meta",
  "xAI",
  "DeepSeek",
  "Mistral",
  "Cohere",
  "Perplexity",
  "Alibaba",
  "Amazon",
  "Microsoft",
  "NVIDIA",
  "Moonshot",
  "Xiaomi",
  "01.AI",
  "NovaSky",
  "Stealth",
  "InclusionAI",
  "Liquid",
  "Teknium",
  "Recursal",
] as const;

export type PopularProvider = (typeof POPULAR_PROVIDER_ORDER)[number];

export const POPULAR_PROVIDER_SET = new Set<string>(POPULAR_PROVIDER_ORDER);

export function getProviderSortRank(provider: string): number {
  const index = POPULAR_PROVIDER_ORDER.indexOf(
    provider as (typeof POPULAR_PROVIDER_ORDER)[number],
  );
  return index === -1 ? POPULAR_PROVIDER_ORDER.length + 1 : index;
}

export const PROVIDER_META: Record<
  string,
  { label: string; logoUrl: string; className: string; glyph: string }
> = {
  // ── Local SVGs ────────────────────────────────────────────────────────────
  OpenAI:    { label: "OpenAI",    logoUrl: local("openai"),    glyph: "AI", className: "" },
  Cohere:    { label: "Cohere",    logoUrl: local("cohere"),    glyph: "Co", className: "" },
  Microsoft: { label: "Microsoft", logoUrl: local("microsoft"), glyph: "MS", className: "" },
  Amazon:    { label: "Amazon",    logoUrl: local("amazon"),    glyph: "Az", className: "" },

  // ── SimpleIcons (brand-on-CDN) ────────────────────────────────────────────
  Anthropic:  { label: "Anthropic",  logoUrl: si("anthropic"),    glyph: "An", className: "" },
  Google:     { label: "Google",     logoUrl: si("google"),       glyph: "G",  className: "" },
  Meta:       { label: "Meta",       logoUrl: si("meta"),         glyph: "∞",  className: "" },
  xAI:        { label: "xAI",        logoUrl: si("x"),            glyph: "𝕏", className: "" },
  DeepSeek:   { label: "DeepSeek",   logoUrl: si("deepseek"),     glyph: "DS", className: "" },
  Mistral:    { label: "Mistral",    logoUrl: si("mistralai"),    glyph: "M",  className: "" },
  Perplexity: { label: "Perplexity", logoUrl: si("perplexity"),   glyph: "P",  className: "" },
  Alibaba:    { label: "Alibaba",    logoUrl: si("alibabacloud"), glyph: "A",  className: "" },
  NVIDIA:     { label: "NVIDIA",     logoUrl: si("nvidia"),       glyph: "NV", className: "" },
  Moonshot:   { label: "Moonshot",   logoUrl: si("moonrepo"),     glyph: "M",  className: "" },
  Xiaomi:     { label: "Xiaomi",     logoUrl: si("xiaomi"),       glyph: "Mi", className: "" },

  // ── Glyph-only (no clean monochrome mark available) ──────────────────────
  "01.AI":     { label: "01.AI",       logoUrl: local("01ai"),        glyph: "01", className: "" },
  NovaSky:     { label: "NovaSky",     logoUrl: local("novasky"),     glyph: "NS", className: "" },
  Stealth:     { label: "Stealth",     logoUrl: local("stealth"),     glyph: "S",  className: "" },
  InclusionAI: { label: "InclusionAI", logoUrl: local("inclusionai"), glyph: "IA", className: "" },
  Liquid:      { label: "Liquid",      logoUrl: local("liquid"),      glyph: "Lq", className: "" },
  Teknium:     { label: "Teknium",     logoUrl: local("teknium"),     glyph: "T",  className: "" },
  Recursal:    { label: "Recursal",    logoUrl: local("recursal"),    glyph: "R",  className: "" },
};

export function getProviderMeta(provider: string) {
  return (
    PROVIDER_META[provider] ?? {
      label: provider,
      logoUrl: "",
      glyph: provider.slice(0, 2).toUpperCase(),
      className: "",
    }
  );
}
