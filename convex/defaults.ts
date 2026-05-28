import { PLAN_API_BUDGET_USD, PLAN_DISPLAY, PLAN_ORDER } from "../src/lib/plans";
import type { ModelCategory, PlanName } from "../src/lib/types";

export type DefaultPlanConfig = {
  name: PlanName;
  monthly_price: number;
  monthly_credits: number;
  trees_per_month: number;
  daily_message_limit: number;
  messages_per_2h_limit: number;
  monthly_api_budget_usd: number;
  max_message_length: number;
  max_conversation_length: number;
  max_file_uploads_per_day: number;
  is_active: boolean;
};

export type DefaultModelConfig = {
  _id: string;
  model_id: string;
  display_name: string;
  provider: string;
  category: ModelCategory;
  credit_cost_per_message: number;
  enabled: boolean;
  supports_streaming: boolean;
  supports_files: boolean;
  supports_vision?: boolean;
  supports_reasoning?: boolean;
  supports_tools?: boolean;
  supports_web_search?: boolean;
  context_length?: number;
  context_description?: string;
  admin_notes?: string;
  free_plan_allowed: boolean;
  estimated_cost_per_message_usd: number;
  sort_order: number;
};

/**
 * Pricing methodology — read this before changing credit costs.
 *
 * Source of truth: live OpenRouter `/api/v1/models` pricing (per token, USD).
 *
 * We model an "average message" as 500 input tokens + 600 output tokens.
 * That gives `estimated_cost_per_message_usd = 500 * price_in + 600 * price_out`.
 *
 * Plan economics: paid plans give roughly 1 credit ≈ €0.0019 of revenue.
 * To stay profitable at scale we target ~50% gross margin per message,
 * i.e. `credit_cost ≈ ceil(cost_usd / 0.0013)`.
 *
 * We then snap to the public credit tiers the spec defines:
 *   small    = 1
 *   standard = 3
 *   advanced = 8
 *   premium  = 15
 *   elite    = 20
 *
 * Models whose true cost would exceed an `elite` slot (e.g. GPT-5.5 Pro,
 * Claude Opus 4.6 Fast) are deliberately excluded. They'd torch our margin.
 *
 * Capability flags use OpenRouter's `architecture.modality` string + known
 * model traits (reasoning models, tool-use availability).
 *
 * If you change a plan's credit allotment, re-run this math.
 */

export const DEFAULT_MODELS: DefaultModelConfig[] = [
  // ──────────────────────────────────────────────────────────────────────
  // OpenAI (GPT)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_openai_gpt_5_nano",
    model_id: "openai/gpt-5-nano",
    display_name: "GPT-5 Nano",
    provider: "OpenAI",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.000265, // 500*5e-8 + 600*4e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 400_000,
    context_description: "Fastest, cheapest GPT-5 variant.",
    sort_order: 11,
  },
  {
    _id: "default_openai_gpt_4o_mini",
    model_id: "openai/gpt-4o-mini",
    display_name: "GPT-4o Mini",
    provider: "OpenAI",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.000435, // 500*1.5e-7 + 600*6e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 128_000,
    context_description: "Cheap, fast, supports vision and tools.",
    sort_order: 12,
  },
  {
    _id: "default_openai_gpt_5_mini",
    model_id: "openai/gpt-5-mini",
    display_name: "GPT-5 Mini",
    provider: "OpenAI",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.001325, // 500*2.5e-7 + 600*2e-6
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 400_000,
    context_description: "Balanced quality + cost in the GPT-5 family.",
    sort_order: 21,
  },
  {
    _id: "default_openai_gpt_4_1_mini",
    model_id: "openai/gpt-4.1-mini",
    display_name: "GPT-4.1 Mini",
    provider: "OpenAI",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.00116, // 500*4e-7 + 600*1.6e-6
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 1_047_576,
    context_description: "1M context window, multimodal, low cost.",
    sort_order: 22,
  },
  {
    _id: "default_openai_gpt_4o",
    model_id: "openai/gpt-4o",
    display_name: "GPT-4o",
    provider: "OpenAI",
    category: "advanced",
    credit_cost_per_message: 8,
    estimated_cost_per_message_usd: 0.00725, // 500*2.5e-6 + 600*1e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 128_000,
    context_description: "Solid all-rounder, strong vision, fast.",
    sort_order: 31,
  },
  {
    _id: "default_openai_gpt_4_1",
    model_id: "openai/gpt-4.1",
    display_name: "GPT-4.1",
    provider: "OpenAI",
    category: "advanced",
    credit_cost_per_message: 8,
    estimated_cost_per_message_usd: 0.0058, // 500*2e-6 + 600*8e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 1_047_576,
    context_description: "1M context, strong coding and instruction following.",
    sort_order: 32,
  },
  {
    _id: "default_openai_gpt_5",
    model_id: "openai/gpt-5",
    display_name: "GPT-5",
    provider: "OpenAI",
    category: "premium",
    credit_cost_per_message: 15,
    estimated_cost_per_message_usd: 0.006625, // 500*1.25e-6 + 600*1e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 400_000,
    context_description: "Frontier general-purpose model.",
    sort_order: 41,
  },
  {
    _id: "default_openai_o3_deep_research",
    model_id: "openai/o3-deep-research",
    display_name: "o3 Deep Research",
    provider: "OpenAI",
    category: "elite",
    credit_cost_per_message: 20,
    estimated_cost_per_message_usd: 0.029, // 500*1e-5 + 600*4e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_reasoning: true,
    supports_tools: true,
    supports_web_search: true,
    context_length: 200_000,
    context_description: "Long-running reasoning + web research.",
    sort_order: 51,
  },
  {
    _id: "default_openai_gpt_5_5",
    model_id: "openai/gpt-5.5",
    display_name: "GPT-5.5",
    provider: "OpenAI",
    category: "elite",
    credit_cost_per_message: 20,
    estimated_cost_per_message_usd: 0.0205, // 500*5e-6 + 600*3e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_reasoning: true,
    supports_tools: true,
    context_length: 1_050_000,
    context_description: "Latest frontier OpenAI model.",
    sort_order: 52,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Anthropic (Claude)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_anthropic_claude_haiku_4_5",
    model_id: "anthropic/claude-haiku-4.5",
    display_name: "Claude Haiku 4.5",
    provider: "Anthropic",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.0035, // 500*1e-6 + 600*5e-6
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 200_000,
    context_description: "Fast, cheap Claude — perfect for everyday tasks.",
    sort_order: 23,
  },
  {
    _id: "default_anthropic_claude_sonnet_4_5",
    model_id: "anthropic/claude-sonnet-4.5",
    display_name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    category: "premium",
    credit_cost_per_message: 15,
    estimated_cost_per_message_usd: 0.0105, // 500*3e-6 + 600*1.5e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 1_000_000,
    context_description: "1M context, strong reasoning, agent-friendly.",
    sort_order: 42,
  },
  {
    _id: "default_anthropic_claude_sonnet_4_6",
    model_id: "anthropic/claude-sonnet-4.6",
    display_name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    category: "premium",
    credit_cost_per_message: 15,
    estimated_cost_per_message_usd: 0.0105,
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 1_000_000,
    context_description: "Latest Sonnet — improved coding and tool use.",
    sort_order: 43,
  },
  {
    _id: "default_anthropic_claude_opus_4_5",
    model_id: "anthropic/claude-opus-4.5",
    display_name: "Claude Opus 4.5",
    provider: "Anthropic",
    category: "elite",
    credit_cost_per_message: 20,
    estimated_cost_per_message_usd: 0.0175, // 500*5e-6 + 600*2.5e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 200_000,
    context_description: "Top-tier Anthropic reasoning model.",
    sort_order: 53,
  },
  {
    _id: "default_anthropic_claude_opus_4_7",
    model_id: "anthropic/claude-opus-4.7",
    display_name: "Claude Opus 4.7",
    provider: "Anthropic",
    category: "elite",
    credit_cost_per_message: 20,
    estimated_cost_per_message_usd: 0.0175,
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 1_000_000,
    context_description: "Latest Opus, 1M context, deepest Claude reasoning.",
    sort_order: 54,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Google (Gemini)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_google_gemini_2_5_flash_lite",
    model_id: "google/gemini-2.5-flash-lite-preview-09-2025",
    display_name: "Gemini 2.5 Flash Lite",
    provider: "Google",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.00029, // 500*1e-7 + 600*4e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 1_048_576,
    context_description: "Cheap, fast Gemini — multimodal, 1M context.",
    sort_order: 13,
  },
  {
    _id: "default_google_gemini_2_5_flash",
    model_id: "google/gemini-2.5-flash",
    display_name: "Gemini 2.5 Flash",
    provider: "Google",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.00165, // 500*3e-7 + 600*2.5e-6
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 1_048_576,
    context_description: "Balanced multimodal model with huge context.",
    sort_order: 24,
  },
  {
    _id: "default_google_gemini_2_5_pro",
    model_id: "google/gemini-2.5-pro",
    display_name: "Gemini 2.5 Pro",
    provider: "Google",
    category: "advanced",
    credit_cost_per_message: 8,
    estimated_cost_per_message_usd: 0.006625, // 500*1.25e-6 + 600*1e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 1_048_576,
    context_description: "Reasoning, long context, multimodal.",
    sort_order: 33,
  },
  {
    _id: "default_google_gemini_3_1_pro",
    model_id: "google/gemini-3.1-pro-preview",
    display_name: "Gemini 3.1 Pro",
    provider: "Google",
    category: "premium",
    credit_cost_per_message: 15,
    estimated_cost_per_message_usd: 0.0082, // 500*2e-6 + 600*1.2e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 1_048_576,
    context_description: "Latest frontier Gemini Pro preview.",
    sort_order: 44,
  },

  // ──────────────────────────────────────────────────────────────────────
  // xAI (Grok)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_xai_grok_4_fast",
    model_id: "x-ai/grok-4-fast",
    display_name: "Grok 4 Fast",
    provider: "xAI",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.0004, // 500*2e-7 + 600*5e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 2_000_000,
    context_description: "Fast Grok with 2M context.",
    sort_order: 14,
  },
  {
    _id: "default_xai_grok_4_20",
    model_id: "x-ai/grok-4.20",
    display_name: "Grok 4.20",
    provider: "xAI",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.002125, // 500*1.25e-6 + 600*2.5e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    supports_reasoning: true,
    context_length: 2_000_000,
    context_description: "Latest Grok with deep reasoning, 2M context.",
    sort_order: 25,
  },

  // ──────────────────────────────────────────────────────────────────────
  // DeepSeek
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_deepseek_chat_v3_1",
    model_id: "deepseek/deepseek-chat-v3.1",
    display_name: "DeepSeek V3.1",
    provider: "DeepSeek",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.000525, // 500*1.5e-7 + 600*7.5e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 32_768,
    context_description: "Strong open chat model, very cheap.",
    sort_order: 15,
  },
  {
    _id: "default_deepseek_v3_1_terminus",
    model_id: "deepseek/deepseek-v3.1-terminus",
    display_name: "DeepSeek V3.1 Terminus",
    provider: "DeepSeek",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.000705, // 500*2.7e-7 + 600*9.5e-7
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_reasoning: true,
    supports_tools: true,
    context_length: 163_840,
    context_description: "Reasoning-tuned DeepSeek with long context.",
    sort_order: 16,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Free OpenRouter tiers — zero unit cost, unlimited even at 0 credits.
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_free_llama_3_3_70b",
    model_id: "meta-llama/llama-3.3-70b-instruct:free",
    display_name: "Llama 3.3 70B (Free)",
    provider: "Meta",
    category: "small",
    credit_cost_per_message: 0,
    estimated_cost_per_message_usd: 0,
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 65_536,
    context_description: "Free tier — solid open chat model, no credits required.",
    sort_order: 1,
  },
  {
    _id: "default_free_deepseek_v3_1",
    model_id: "deepseek/deepseek-chat-v3.1:free",
    display_name: "DeepSeek V3.1 (Free)",
    provider: "DeepSeek",
    category: "small",
    credit_cost_per_message: 0,
    estimated_cost_per_message_usd: 0,
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 32_768,
    context_description: "Free tier — strong open chat, no credits required.",
    sort_order: 2,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Meta (Llama)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_meta_llama_4_scout",
    model_id: "meta-llama/llama-4-scout",
    display_name: "Llama 4 Scout",
    provider: "Meta",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.00023, // 500*8e-8 + 600*3e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_vision: true,
    supports_tools: true,
    context_length: 327_680,
    context_description: "Open Llama 4, multimodal, very low cost.",
    sort_order: 17,
  },
  {
    _id: "default_meta_llama_4_maverick",
    model_id: "meta-llama/llama-4-maverick",
    display_name: "Llama 4 Maverick",
    provider: "Meta",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.00045, // 500*1.5e-7 + 600*6e-7
    free_plan_allowed: true,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_vision: true,
    supports_tools: true,
    context_length: 1_048_576,
    context_description: "Larger Llama 4 with 1M context.",
    sort_order: 18,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Mistral
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_mistral_large_3",
    model_id: "mistralai/mistral-large-2512",
    display_name: "Mistral Large 3",
    provider: "Mistral",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.00115, // 500*5e-7 + 600*1.5e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_vision: true,
    supports_tools: true,
    context_length: 262_144,
    context_description: "Mistral's flagship general-purpose model.",
    sort_order: 26,
  },
  {
    _id: "default_mistral_codestral",
    model_id: "mistralai/codestral-2508",
    display_name: "Codestral",
    provider: "Mistral",
    category: "small",
    credit_cost_per_message: 1,
    estimated_cost_per_message_usd: 0.00069, // 500*3e-7 + 600*9e-7
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 256_000,
    context_description: "Code-specialized Mistral model.",
    sort_order: 19,
  },
  {
    _id: "default_mistral_medium_3_5",
    model_id: "mistralai/mistral-medium-3-5",
    display_name: "Mistral Medium 3.5",
    provider: "Mistral",
    category: "advanced",
    credit_cost_per_message: 8,
    estimated_cost_per_message_usd: 0.00525, // 500*1.5e-6 + 600*7.5e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_vision: true,
    supports_tools: true,
    context_length: 262_144,
    context_description: "Cost-effective Mistral mid-tier.",
    sort_order: 34,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Cohere
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_cohere_command_a",
    model_id: "cohere/command-a",
    display_name: "Command A",
    provider: "Cohere",
    category: "advanced",
    credit_cost_per_message: 8,
    estimated_cost_per_message_usd: 0.00725, // 500*2.5e-6 + 600*1e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 256_000,
    context_description: "Cohere's flagship enterprise model.",
    sort_order: 35,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Perplexity
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_perplexity_sonar_pro",
    model_id: "perplexity/sonar-pro-search",
    display_name: "Sonar Pro Search",
    provider: "Perplexity",
    category: "premium",
    credit_cost_per_message: 15,
    estimated_cost_per_message_usd: 0.0105, // 500*3e-6 + 600*1.5e-5
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_vision: true,
    supports_tools: true,
    supports_web_search: true,
    context_length: 200_000,
    context_description: "Built-in web search with citations.",
    sort_order: 45,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Alibaba (Qwen)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_qwen_qwen3_max",
    model_id: "qwen/qwen3-max",
    display_name: "Qwen 3 Max",
    provider: "Alibaba",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.00273, // 500*7.8e-7 + 600*3.9e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 262_144,
    context_description: "Top Qwen 3 general model.",
    sort_order: 27,
  },
  {
    _id: "default_qwen_qwen3_coder_plus",
    model_id: "qwen/qwen3-coder-plus",
    display_name: "Qwen 3 Coder Plus",
    provider: "Alibaba",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.002275, // 500*6.5e-7 + 600*3.25e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: false,
    supports_tools: true,
    context_length: 1_000_000,
    context_description: "Code-tuned Qwen 3, 1M context.",
    sort_order: 28,
  },

  // ──────────────────────────────────────────────────────────────────────
  // Amazon (Nova)
  // ──────────────────────────────────────────────────────────────────────
  {
    _id: "default_amazon_nova_lite_2",
    model_id: "amazon/nova-2-lite-v1",
    display_name: "Nova 2 Lite",
    provider: "Amazon",
    category: "standard",
    credit_cost_per_message: 3,
    estimated_cost_per_message_usd: 0.00165, // 500*3e-7 + 600*2.5e-6
    free_plan_allowed: false,
    enabled: true,
    supports_streaming: true,
    supports_files: true,
    supports_vision: true,
    supports_tools: true,
    context_length: 1_000_000,
    context_description: "Amazon Nova small multimodal.",
    sort_order: 29,
  },
];

export function defaultPlanConfig(planName: PlanName): DefaultPlanConfig {
  const plan = PLAN_DISPLAY[planName];
  return {
    name: plan.name,
    monthly_price: plan.price,
    monthly_credits: plan.credits,
    trees_per_month: plan.trees,
    daily_message_limit:
      plan.name === "free" ? 20 : plan.name === "basic" ? 150 : plan.name === "starter" ? 350 : 700,
    messages_per_2h_limit:
      plan.name === "free" ? 8 : plan.name === "basic" ? 100 : plan.name === "starter" ? 160 : 300,
    monthly_api_budget_usd: PLAN_API_BUDGET_USD[plan.name],
    max_message_length: plan.name === "free" ? 8000 : plan.name === "basic" ? 16000 : 32000,
    max_conversation_length: plan.name === "free" ? 100 : plan.name === "basic" ? 250 : 500,
    max_file_uploads_per_day: plan.name === "free" ? 0 : plan.name === "basic" ? 5 : 12,
    is_active: true,
  };
}

export function defaultPlanConfigs() {
  return PLAN_ORDER.map(defaultPlanConfig);
}
