import { NextRequest } from "next/server";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "@/lib/convex-server";
import { openRouterStream, parseSseLine } from "@/lib/openrouter";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
// Allow up to ~5 minutes for long generations
export const maxDuration = 300;

const Attachment = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(["pdf", "image"]),
  media_type: z.string().min(1).max(100),
  data_url: z.string().min(1).max(15_000_000),
});

const Body = z.object({
  chat_id: z.string().nullable(),
  model_id: z.string().min(1),
  message: z.string().min(1).max(32000),
  regenerate: z.boolean().optional().default(false),
  reasoning_effort: z
    .enum(["none", "low", "medium", "high"])
    .optional()
    .default("none"),
  web_search: z.boolean().optional().default(false),
  web_fetch: z.boolean().optional().default(false),
  auto: z.boolean().optional().default(false),
  attachments: z.array(Attachment).max(4).optional().default([]),
});

const APP_CREDITS_PER_USD = 1000;

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Convex serializes a thrown `ConvexError` over HTTP as something like:
 *   `Uncaught ConvexError: {"code":"rate_limited","message":"…"} at handler …`
 * Pull the human-readable `message` out so the client never sees the
 * "Uncaught …" wrapper. Falls back to the raw error message.
 */
function readableError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const raw = error.message;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (parsed && typeof parsed.message === "string") return parsed.message;
    } catch {
      // Not JSON — fall through.
    }
  }
  // Strip the "Uncaught ConvexError:" prefix if present.
  return raw.replace(/^Uncaught\s+ConvexError:\s*/i, "");
}

function sseEvent(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function buildOpenRouterMessages(
  turns: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  prompt: string,
  attachments: Array<z.infer<typeof Attachment>>,
) {
  if (attachments.length === 0) {
    return turns;
  }

  const prefix = turns.slice(0, -1);
  const lastTurn = turns[turns.length - 1];
  if (!lastTurn || lastTurn.role !== "user") {
    return turns;
  }

  return [
    ...prefix,
    {
      ...lastTurn,
      content: [
        { type: "text" as const, text: prompt },
        ...attachments.map((attachment) =>
          attachment.kind === "image"
            ? {
                type: "image_url" as const,
                image_url: { url: attachment.data_url },
              }
            : {
                type: "file" as const,
                file: {
                  filename: attachment.name,
                  file_data: attachment.data_url,
                },
              },
        ),
      ],
    },
  ];
}

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return jsonError(401, "Not authenticated");
  }
  const token = await getToken({ template: "convex" });
  if (!token) {
    return jsonError(401, "Missing Convex auth token");
  }

  // Per-user burst guard (in-memory): 30 req / 30s
  const burst = checkRateLimit(`chat:burst:${userId}`, 30, 30_000);
  if (!burst.allowed) {
    return jsonError(
      429,
      "You're sending messages too quickly. Try again in a moment.",
    );
  }

  let body;
  try {
    body = Body.parse(await req.json());
  } catch {
    return jsonError(400, "Invalid request body");
  }
  let prep;
  try {
    prep = await fetchMutation(
      api.messages.prepareToSend,
      {
        chatId: body.chat_id ? (body.chat_id as Id<"chats">) : undefined,
        modelId: body.model_id,
        message: body.message,
        regenerate: body.regenerate,
      },
      { token },
    );
  } catch (error) {
    const message = readableError(error, "Failed to prepare message");
    const status =
      message.includes("Not enough credits") || message.includes("Upgrade")
        ? 402
        : message.toLowerCase().includes("limit") ||
            message.toLowerCase().includes("break")
          ? 429
          : message.includes("not available")
            ? 404
            : 400;
    return jsonError(status, message);
  }

  const hasImageAttachment = body.attachments.some(
    (attachment) => attachment.kind === "image",
  );
  const hasPdfAttachment = body.attachments.some(
    (attachment) => attachment.kind === "pdf",
  );
  if (hasPdfAttachment && !prep.model.supports_files) {
    return jsonError(
      400,
      "This model cannot read documents yet. Pick a document-ready model to upload PDFs.",
    );
  }
  if (hasImageAttachment && !prep.model.supports_vision) {
    return jsonError(
      400,
      "This model cannot read images yet. Pick a vision model to upload screenshots or photos.",
    );
  }

  const requestMessages = buildOpenRouterMessages(
    prep.turns,
    body.message,
    body.attachments,
  );

  // When the user opts into Auto routing, hand the request to OpenRouter's
  // meta-router. The user's selected model still gates plan access and seeds
  // the up-front credit hold; the actual cost comes back in the SSE `usage`
  // event and is reconciled in finalizeSend.
  // ":online" enables OpenRouter's universal web-search plugin on top of any
  // model — but it only applies to concrete model ids, not the meta-router.
  // Stacking it onto `openrouter/auto` makes the router refuse to pick a
  // model (we'd see "no endpoints found" or a single fallback every time),
  // which is exactly the "auto isn't switching models" symptom. So we keep
  // the suffix for the explicit-model path only.
  const providerModelId = body.auto
    ? "openrouter/auto"
    : body.web_search
      ? `${prep.model.model_id}:online`
      : prep.model.model_id;

  // Provider call
  let providerResp: Response;
  try {
    providerResp = await openRouterStream({
      model: providerModelId,
      messages: requestMessages,
      temperature: 0.7,
      stream: true,
      reasoning:
        body.reasoning_effort && body.reasoning_effort !== "none"
          ? { effort: body.reasoning_effort }
          : undefined,
      provider: {
        allow_fallbacks: true,
        data_collection: "deny",
      },
      tools: [
        ...(body.web_search
          ? [
              {
                type: "openrouter:web_search" as const,
                parameters: {
                  engine: "auto",
                  max_results: 5,
                  search_context_size: "medium",
                },
              },
            ]
          : []),
        ...(body.web_fetch
          ? [
              {
                type: "openrouter:web_fetch" as const,
                parameters: {
                  engine: "auto",
                  max_content_tokens: 50000,
                },
              },
            ]
          : []),
      ],
      // PDFs need OpenRouter's file-parser plugin to be turned into text
      // before being passed to the model. Without this the request 400s.
      plugins: hasPdfAttachment
        ? [{ id: "file-parser", pdf: { engine: "native" } }]
        : undefined,
    });
  } catch {
    await fetchMutation(
      api.messages.failSend,
      {
        chatId: prep.chatId,
        assistantMessageId: prep.assistantMessageId,
        provider: prep.model.provider,
        modelId: prep.model.model_id,
        creditsCharged: prep.cost,
        estimatedApiCost: prep.model.estimated_cost_per_message_usd,
        errorMessage: "Provider unreachable",
      },
      { token },
    );
    return jsonError(
      502,
      "We can't reach the AI right now. No credits were charged — please try again in a moment.",
    );
  }

  if (!providerResp.ok || !providerResp.body) {
    const errText = await providerResp.text().catch(() => "");
    let providerMessage = errText.slice(0, 500);
    try {
      const parsed = JSON.parse(errText);
      providerMessage =
        parsed?.error?.message ?? parsed?.message ?? providerMessage;
    } catch {
      // not JSON — fall through with raw text
    }
    await fetchMutation(
      api.messages.failSend,
      {
        chatId: prep.chatId,
        assistantMessageId: prep.assistantMessageId,
        provider: prep.model.provider,
        modelId: prep.model.model_id,
        creditsCharged: prep.cost,
        estimatedApiCost: prep.model.estimated_cost_per_message_usd,
        errorMessage: `${providerResp.status}: ${providerMessage}`,
      },
      { token },
    );
    return jsonError(
      502,
      `Something went wrong with the model (${providerResp.status})${providerMessage ? `: ${providerMessage}` : ""}. No credits were charged.`,
    );
  }

  // Stream provider SSE → our SSE, accumulate full text, then persist.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = providerResp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let reasoningText = "";
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;
      let actualApiCost: number | undefined;
      let actualCreditsCharged: number | undefined;
      let providerName: string = prep.model.provider;
      // For Auto mode this gets overwritten with the real model id
      // OpenRouter routed to (e.g. "anthropic/claude-sonnet-4.6").
      let resolvedModelId: string = prep.model.model_id;
      // Deduped url_citation annotations collected from the stream — sent to
      // finalizeSend so they persist alongside the assistant message.
      const citations: { url: string; title?: string; content?: string }[] = [];
      const seenCitationUrls = new Set<string>();

      const persistAndClose = async (
        status: "ok" | "error",
        errorMessage?: string,
      ) => {
        try {
          if (status === "ok") {
            await fetchMutation(
              api.messages.finalizeSend,
              {
                chatId: prep.chatId,
                assistantMessageId: prep.assistantMessageId,
                provider: providerName,
                modelId: resolvedModelId,
                creditsCharged: prep.cost,
                estimatedApiCost: prep.model.estimated_cost_per_message_usd,
                actualCreditsCharged,
                actualApiCost,
                content: assistantText,
                promptTokens,
                completionTokens,
                citations: citations.length > 0 ? citations : undefined,
              },
              { token },
            );
          } else {
            await fetchMutation(
              api.messages.failSend,
              {
                chatId: prep.chatId,
                assistantMessageId: prep.assistantMessageId,
                provider: providerName,
                modelId: resolvedModelId,
                creditsCharged: prep.cost,
                estimatedApiCost: prep.model.estimated_cost_per_message_usd,
                actualCreditsCharged,
                actualApiCost,
                errorMessage: errorMessage ?? "empty stream",
                partialContent: assistantText,
                promptTokens,
                completionTokens,
              },
              { token },
            );
          }
        } catch {
          // Last-ditch: never throw out of the stream finalizer
        }
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const parsed = parseSseLine(line.trim());
            if (!parsed) continue;
            if (parsed.provider) {
              providerName = parsed.provider;
            }
            if (
              parsed.model &&
              parsed.model !== "openrouter/auto" &&
              parsed.model !== resolvedModelId
            ) {
              // Auto-router resolves to a concrete model after the first
              // chunk. Stream it live so the user sees Auto pick a model
              // without waiting for the message to finalize.
              resolvedModelId = parsed.model;
              controller.enqueue(
                encoder.encode(
                  sseEvent({ type: "model", model: parsed.model }),
                ),
              );
            }
            if (parsed.usage) {
              promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
              completionTokens =
                parsed.usage.completion_tokens ?? completionTokens;
              if (typeof parsed.usage.cost === "number") {
                actualApiCost = parsed.usage.cost;
                actualCreditsCharged = Math.max(
                  1,
                  Math.ceil(parsed.usage.cost * APP_CREDITS_PER_USD),
                );
              }
            }
            if (parsed.error?.message) {
              throw new Error(parsed.error.message);
            }
            if (parsed.reasoning) {
              reasoningText += parsed.reasoning;
              controller.enqueue(
                encoder.encode(
                  sseEvent({ type: "reasoning", text: parsed.reasoning }),
                ),
              );
            }
            if (parsed.citations) {
              const fresh: typeof citations = [];
              for (const citation of parsed.citations) {
                if (seenCitationUrls.has(citation.url)) continue;
                seenCitationUrls.add(citation.url);
                fresh.push(citation);
              }
              if (fresh.length > 0) {
                citations.push(...fresh);
                controller.enqueue(
                  encoder.encode(
                    sseEvent({ type: "citations", items: fresh }),
                  ),
                );
              }
            }
            if (parsed.delta) {
              assistantText += parsed.delta;
              controller.enqueue(
                encoder.encode(sseEvent({ type: "delta", text: parsed.delta })),
              );
            }
            if (parsed.done) {
              controller.enqueue(
                encoder.encode(
                  sseEvent({
                    type: "done",
                    usage: actualApiCost
                      ? {
                          prompt_tokens: promptTokens,
                          completion_tokens: completionTokens,
                          cost: actualApiCost,
                          credits: actualCreditsCharged,
                          provider: providerName,
                        }
                      : undefined,
                  }),
                ),
              );
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        await persistAndClose("ok");
        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "stream error";
        controller.enqueue(
          encoder.encode(sseEvent({ type: "error", error: msg })),
        );
        await persistAndClose("error", msg);
        controller.close();
      }
    },
    async cancel() {
      // Client aborted. Save whatever we have.
      try {
        await providerResp.body?.cancel();
      } catch {
        /* ignore */
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      "x-chat-id": prep.chatId,
    },
  });
}
