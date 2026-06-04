import { ConvexError, v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { DEFAULT_MODELS } from "./defaults";
import { getProfile, mapModel, requireIdentity } from "./helpers";
import {
  getProviderSortRank,
  POPULAR_PROVIDER_SET,
} from "../src/lib/model-providers";

const AVERAGE_PROMPT_TOKENS = 1200;
const AVERAGE_COMPLETION_TOKENS = 800;
const BATCH_SIZE = 50;

type OpenRouterModel = {
  id: string;
  name?: string;
  description?: string;
  created?: number;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: Record<string, string | number | undefined>;
  supported_parameters?: string[];
  expiration_date?: string | null;
};

const PROVIDER_SLUG_MAP: Record<string, string> = {
  "x-ai": "xAI",
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  "google-deepmind": "Google",
  meta: "Meta",
  "meta-llama": "Meta",
  mistralai: "Mistral",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  moonshotai: "Moonshot",
  moonshot: "Moonshot",
  qwen: "Alibaba",
  alibaba: "Alibaba",
  xiaomi: "Xiaomi",
  stealth: "Stealth",
  inclusionai: "InclusionAI",
  "01-ai": "01.AI",
  cohere: "Cohere",
  nvidia: "NVIDIA",
  openrouter: "Vercilio",
  perplexity: "Perplexity",
  perplexityai: "Perplexity",
  amazon: "Amazon",
  bedrock: "Amazon",
  microsoft: "Microsoft",
  liquid: "Liquid",
  teknium: "Teknium",
  recursal: "Recursal",
  novasky: "NovaSky",
  "nova-sky": "NovaSky",
};

function parseProviderLabel(model: OpenRouterModel): string {
  const rawName = model.name?.trim();
  // "Anthropic: Claude Sonnet" → "Anthropic"
  if (rawName?.includes(":")) {
    const before = rawName.split(":")[0]!.trim();
    // Map known display names back to our canonical provider names
    const displayMap: Record<string, string> = {
      Anthropic: "Anthropic",
      OpenAI: "OpenAI",
      Google: "Google",
      Meta: "Meta",
      Mistral: "Mistral",
      DeepSeek: "DeepSeek",
      xAI: "xAI",
      Cohere: "Cohere",
      Perplexity: "Perplexity",
      NVIDIA: "NVIDIA",
      Amazon: "Amazon",
      Microsoft: "Microsoft",
      Liquid: "Liquid",
    };
    return displayMap[before] ?? before;
  }

  const slug = model.id.replace(/^~/, "").split("/")[0] ?? "OpenRouter";
  return (
    PROVIDER_SLUG_MAP[slug.toLowerCase()] ??
    slug
      .split("-")
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function parseDisplayName(model: OpenRouterModel, provider: string): string {
  const rawName = model.name?.trim();
  if (!rawName) {
    return model.id.replace(/^~/, "");
  }
  // Strip "Provider: " prefix in any capitalisation variant
  const colonIdx = rawName.indexOf(":");
  if (colonIdx !== -1) {
    return rawName.slice(colonIdx + 1).trim();
  }
  // Strip provider name prefix without colon e.g. "Anthropic Claude Haiku Latest"
  if (rawName.toLowerCase().startsWith(provider.toLowerCase() + " ")) {
    return rawName.slice(provider.length).trim();
  }
  return rawName;
}

function getModalities(values?: string[]): string[] {
  return (values ?? []).map((value) => value.toLowerCase());
}

function hasParameter(model: OpenRouterModel, ...names: string[]): boolean {
  const supported = new Set(
    (model.supported_parameters ?? []).map((value) => value.toLowerCase()),
  );
  return names.some((name) => supported.has(name));
}

function parsePrice(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function estimateMessageCostUsd(model: OpenRouterModel): number {
  const prompt = parsePrice(model.pricing?.prompt);
  const completion = parsePrice(model.pricing?.completion);
  const request = parsePrice(model.pricing?.request);
  const image = parsePrice(model.pricing?.image);
  const audio = parsePrice(model.pricing?.audio);
  const internalReasoning = parsePrice(model.pricing?.internal_reasoning);
  const total =
    request +
    prompt * AVERAGE_PROMPT_TOKENS +
    completion * AVERAGE_COMPLETION_TOKENS +
    internalReasoning * Math.floor(AVERAGE_COMPLETION_TOKENS / 2) +
    image +
    audio;
  return Number(total.toFixed(6));
}

function toCredits(estimatedCost: number): number {
  return Math.max(1, Math.ceil(estimatedCost * 1000));
}

function toCategory(
  estimatedCost: number,
): "small" | "standard" | "advanced" | "premium" | "elite" {
  if (estimatedCost <= 0.002) return "small";
  if (estimatedCost <= 0.008) return "standard";
  if (estimatedCost <= 0.02) return "advanced";
  if (estimatedCost <= 0.06) return "premium";
  return "elite";
}

function supportsFiles(model: OpenRouterModel): boolean {
  return getModalities(model.architecture?.input_modalities).includes("file");
}

function supportsVision(model: OpenRouterModel): boolean {
  return getModalities(model.architecture?.input_modalities).includes("image");
}

function supportsTools(model: OpenRouterModel): boolean {
  return hasParameter(model, "tools", "tool_choice", "parallel_tool_calls");
}

function supportsReasoning(model: OpenRouterModel): boolean {
  const haystack = `${model.id} ${model.name ?? ""} ${model.description ?? ""}`.toLowerCase();
  return (
    hasParameter(model, "reasoning", "include_reasoning") ||
    haystack.includes("reason") ||
    haystack.includes("thinking") ||
    haystack.includes("o1") ||
    haystack.includes("o3")
  );
}

function supportsWebSearch(model: OpenRouterModel): boolean {
  const haystack = `${model.id} ${model.name ?? ""} ${model.description ?? ""}`.toLowerCase();
  return hasParameter(model, "web_search") || haystack.includes("search");
}

function isFreePlanAllowed(model: OpenRouterModel, estimatedCost: number): boolean {
  return (
    estimatedCost === 0 ||
    toCredits(estimatedCost) <= 3 ||
    model.id.endsWith(":free")
  );
}

const NON_CONVERSATIONAL_MODEL_RE =
  /(audio|tts|transcri|speech|embed|embedding|moderation|rerank|image preview|image generation|text-to-image|text to image|dall[ -]?e|stable[ -]?diffusion|sdxl|flux|recraft|midjourney|imagen|nano banana)/i;

function isConversationalModel(model: OpenRouterModel): boolean {
  const inputModalities = getModalities(model.architecture?.input_modalities);
  const outputModalities = getModalities(model.architecture?.output_modalities);
  const modality = (model.architecture?.modality ?? "").toLowerCase();
  const haystack =
    `${model.id} ${model.name ?? ""} ${model.description ?? ""}`.toLowerCase();
  const idAndName = `${model.id} ${model.name ?? ""}`.toLowerCase();

  if (!inputModalities.includes("text")) return false;
  if (!outputModalities.includes("text") && !modality.endsWith("->text")) {
    return false;
  }
  if (NON_CONVERSATIONAL_MODEL_RE.test(idAndName)) return false;
  if (
    (outputModalities.includes("image") || outputModalities.includes("audio")) &&
    !outputModalities.every((entry) => entry === "text")
  ) {
    return false;
  }
  if (
    haystack.includes("image generation") ||
    haystack.includes("text-to-image") ||
    haystack.includes("image preview")
  ) {
    return false;
  }
  return true;
}

function modelPopularityScore(model: OpenRouterModel): number {
  const haystack = `${model.id} ${model.name ?? ""}`.toLowerCase();
  let score = 0;
  if (haystack.includes("latest")) score += 1000;
  if (model.id.startsWith("~")) score += 500;
  if (model.id.endsWith(":free")) score -= 200;
  if (haystack.includes("preview")) score -= 100;
  return score;
}

function compareCatalogModels(a: OpenRouterModel, b: OpenRouterModel): number {
  const providerDiff =
    getProviderSortRank(parseProviderLabel(a)) -
    getProviderSortRank(parseProviderLabel(b));
  if (providerDiff !== 0) return providerDiff;

  const popularityDiff = modelPopularityScore(b) - modelPopularityScore(a);
  if (popularityDiff !== 0) return popularityDiff;

  const createdDiff = (b.created ?? 0) - (a.created ?? 0);
  if (createdDiff !== 0) return createdDiff;

  return parseDisplayName(a, parseProviderLabel(a)).localeCompare(
    parseDisplayName(b, parseProviderLabel(b)),
  );
}

function toCatalogRow(model: OpenRouterModel, index: number) {
  const provider = parseProviderLabel(model);
  const estimatedCost = estimateMessageCostUsd(model);
  return {
    model_id: model.id,
    display_name: parseDisplayName(model, provider),
    provider,
    category: toCategory(estimatedCost),
    credit_cost_per_message: toCredits(estimatedCost),
    enabled: !model.expiration_date,
    supports_streaming: true,
    supports_files: supportsFiles(model),
    supports_vision: supportsVision(model),
    supports_reasoning: supportsReasoning(model),
    supports_tools: supportsTools(model),
    supports_web_search: supportsWebSearch(model),
    context_length: model.context_length,
    context_description: model.description?.slice(0, 500),
    admin_notes: model.supported_parameters?.join(", ") ?? "",
    free_plan_allowed: isFreePlanAllowed(model, estimatedCost),
    estimated_cost_per_message_usd: estimatedCost,
    sort_order: index + 1,
  };
}

// Keep the catalog aligned with the provider set we intentionally surface in
// the UI, so "All" only contains models from supported providers.
function isAllowedProvider(provider: string) {
  return POPULAR_PROVIDER_SET.has(provider);
}

export const listAvailable = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await getProfile(ctx, identity.subject);
    if (!profile) {
      return [];
    }

    const models = await ctx.db.query("models").collect();
    const source = models.length > 0 ? models : DEFAULT_MODELS;
    return source
      .filter((model) => isAllowedProvider(model.provider))
      .filter((model) => model.enabled)
      .sort((a, b) => {
        const providerDiff =
          getProviderSortRank(a.provider) - getProviderSortRank(b.provider);
        return providerDiff !== 0 ? providerDiff : a.sort_order - b.sort_order;
      })
      .map(mapModel)
      .map((model) => ({
        ...model,
        can_use: profile.plan_name !== "free" || model.free_plan_allowed,
      }));
  },
});

export const syncOpenRouterCatalog = action({
  args: {},
  handler: async (ctx) => {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new ConvexError({
        code: "provider_error",
        message: `OpenRouter catalog fetch failed: ${response.status} ${text.slice(0, 200)}`,
      });
    }

    const payload = await response.json();
    const models = Array.isArray(payload?.data)
      ? (payload.data as OpenRouterModel[])
      : [];
    const rows = models
      .filter(isConversationalModel)
      .sort(compareCatalogModels)
      .map(toCatalogRow)
      .filter((row) => isAllowedProvider(row.provider));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await ctx.runMutation(internal.models.upsertCatalogBatch, {
        rows: rows.slice(i, i + BATCH_SIZE),
      });
    }

    await ctx.runMutation(internal.models.disableMissingCatalogModels, {
      activeModelIds: rows.map((row) => row.model_id),
      activeProviders: Array.from(new Set(rows.map((row) => row.provider))),
    });

    return {
      synced: rows.length,
      providers: Array.from(new Set(rows.map((row) => row.provider))).length,
    };
  },
});

export const upsertCatalogBatch = internalMutation({
  args: {
    rows: v.array(
      v.object({
        model_id: v.string(),
        display_name: v.string(),
        provider: v.string(),
        category: v.union(
          v.literal("small"),
          v.literal("standard"),
          v.literal("advanced"),
          v.literal("premium"),
          v.literal("elite"),
        ),
        credit_cost_per_message: v.number(),
        enabled: v.boolean(),
        supports_streaming: v.boolean(),
        supports_files: v.boolean(),
        supports_vision: v.optional(v.boolean()),
        supports_reasoning: v.optional(v.boolean()),
        supports_tools: v.optional(v.boolean()),
        supports_web_search: v.optional(v.boolean()),
        context_length: v.optional(v.number()),
        context_description: v.optional(v.string()),
        admin_notes: v.optional(v.string()),
        free_plan_allowed: v.boolean(),
        estimated_cost_per_message_usd: v.number(),
        sort_order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const existing = await ctx.db
        .query("models")
        .withIndex("by_model_id", (q) => q.eq("model_id", row.model_id))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, row);
      } else {
        await ctx.db.insert("models", row);
      }
    }

    return args.rows.length;
  },
});

export const disableMissingCatalogModels = internalMutation({
  args: {
    activeModelIds: v.array(v.string()),
    activeProviders: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const activeIds = new Set(args.activeModelIds);
    const activeProviders = new Set(args.activeProviders);
    const models = await ctx.db.query("models").collect();
    let disabled = 0;

    for (const model of models) {
      if (
        model.enabled &&
        ((!isAllowedProvider(model.provider)) ||
          (activeProviders.has(model.provider) &&
            !activeIds.has(model.model_id)))
      ) {
        await ctx.db.patch(model._id, { enabled: false });
        disabled += 1;
      }
    }

    return disabled;
  },
});
