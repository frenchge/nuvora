/**
 * Thin OpenRouter client. The OpenRouter API is OpenAI-compatible.
 *
 * NEVER call this from the client.
 */

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
}

export type OpenRouterContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: {
        url: string;
      };
    }
  | {
      type: "file";
      file: {
        filename: string;
        file_data: string;
      };
    };

export interface OpenRouterRequest {
  model: string;
  messages: ChatTurn[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  reasoning?: {
    effort: "low" | "medium" | "high";
  };
  provider?: {
    sort?: "price" | "throughput" | "latency";
    allow_fallbacks?: boolean;
    require_parameters?: boolean;
    data_collection?: "allow" | "deny";
  };
  tools?: Array<
    | { type: "openrouter:web_search"; parameters?: Record<string, unknown> }
    | { type: "openrouter:web_fetch"; parameters?: Record<string, unknown> }
  >;
  plugins?: Array<
    | {
        id: "file-parser";
        pdf?: {
          engine: "cloudflare-ai" | "mistral-ocr" | "native";
        };
      }
  >;
}

function headers(): HeadersInit {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "https://vercilio.ai",
    "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME ?? "Vercilio",
  };
}

export async function openRouterStream(
  req: OpenRouterRequest,
): Promise<Response> {
  return fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ...req, stream: true }),
  });
}

export interface CompletionResult {
  content: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
}

export async function openRouterComplete(
  req: OpenRouterRequest,
): Promise<CompletionResult> {
  const resp = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ...req, stream: false }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenRouter error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return {
    content: data?.choices?.[0]?.message?.content ?? "",
    prompt_tokens: data?.usage?.prompt_tokens ?? null,
    completion_tokens: data?.usage?.completion_tokens ?? null,
  };
}

/**
 * Parse a single SSE line from OpenRouter. Returns the delta text or null.
 * OpenRouter follows OpenAI's wire format: `data: {json}` or `data: [DONE]`.
 */
export type ParsedCitation = {
  url: string;
  title?: string;
  content?: string;
};

export function parseSseLine(line: string): {
  delta: string;
  done: boolean;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
    completion_tokens_details?: { reasoning_tokens?: number };
  };
  error?: { code?: string | number; message?: string };
  provider?: string;
  /** Resolved model id reported by OpenRouter (matters for `openrouter/auto`). */
  model?: string;
  reasoning?: string;
  /** url_citation annotations from web-search-enabled responses. */
  citations?: ParsedCitation[];
} | null {
  if (!line.startsWith("data:")) return null;
  const payload = line.slice(5).trim();
  if (!payload) return null;
  if (payload === "[DONE]") return { delta: "", done: true };
  try {
    const obj = JSON.parse(payload);
    const choice = obj?.choices?.[0];
    const delta = choice?.delta?.content ?? "";
    const reasoning = choice?.delta?.reasoning ?? "";
    const rawAnnotations = [
      ...(Array.isArray(choice?.delta?.annotations) ? choice.delta.annotations : []),
      ...(Array.isArray(choice?.message?.annotations) ? choice.message.annotations : []),
    ];
    const citations: ParsedCitation[] = [];
    for (const ann of rawAnnotations) {
      const url =
        ann?.url_citation?.url ?? ann?.url ?? ann?.uri ?? null;
      if (typeof url !== "string" || !url) continue;
      citations.push({
        url,
        title: ann?.url_citation?.title ?? ann?.title ?? undefined,
        content: ann?.url_citation?.content ?? ann?.snippet ?? undefined,
      });
    }
    return {
      delta,
      reasoning,
      done:
        choice?.finish_reason === "stop" ||
        choice?.finish_reason === "error",
      usage: obj?.usage,
      error: obj?.error,
      provider: typeof obj?.provider === "string" ? obj.provider : undefined,
      model: typeof obj?.model === "string" ? obj.model : undefined,
      citations: citations.length > 0 ? citations : undefined,
    };
  } catch {
    return null;
  }
}
