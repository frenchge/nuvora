"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Send,
  StopCircle,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Brain,
  Eye,
  FileText,
  Paperclip,
  SlidersHorizontal,
  Globe,
  Wand2,
  Compass,
  Code2,
  BookOpen,
  Sparkles,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelSelector } from "@/components/chat/model-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/chat/markdown";
import { InstantTooltip } from "@/components/ui/tooltip";
import { SquigglyText } from "@/components/ui/squiggly-text";
import { getProviderSortRank } from "@/lib/model-providers";
import { cn, formatCredits } from "@/lib/utils";
import type { AppModel, Message } from "@/lib/types";

interface Props {
  initialChatId: string | null;
  initialMessages: Message[];
  models: AppModel[];
  initialBalance: number;
  defaultModelId: string;
}

interface MessageCitation {
  url: string;
  title?: string;
  content?: string;
}

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  model_id?: string | null;
  citations?: MessageCitation[] | null;
  pending?: boolean;
  attachments?: PendingAttachment[];
}

interface PendingAttachment {
  id: string;
  name: string;
  kind: "pdf" | "image";
  mediaType: string;
  dataUrl: string;
}

const STORAGE_MODEL_KEY = "vercilio.selectedModel";
const STORAGE_REASONING_KEY = "vercilio.reasoningEffort";
const STORAGE_AUTO_KEY = "vercilio.autoRouter";
const STORAGE_WEBSEARCH_KEY = "vercilio.webSearch";

type GreetingCategoryKey = "create" | "explore" | "code" | "learn";

const GREETING_CATEGORIES: ReadonlyArray<{
  key: GreetingCategoryKey;
  icon: typeof Wand2;
}> = [
  { key: "create", icon: Wand2 },
  { key: "explore", icon: Compass },
  { key: "code", icon: Code2 },
  { key: "learn", icon: BookOpen },
];

const AUTO_SCROLL_THRESHOLD_PX = 120;
const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024;

function getConversationLabel(messages: UiMessage[]) {
  const firstUserMessage = messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0,
  );
  if (!firstUserMessage) return "New chat";
  return firstUserMessage.content.trim().slice(0, 40);
}

export function ChatClient({
  initialChatId,
  initialMessages,
  models,
  initialBalance,
  defaultModelId,
}: Props) {
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<UiMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      model_id: m.model_id,
      citations: m.citations ?? null,
    })),
  );
  const [modelId, setModelId] = useState<string>(defaultModelId);
  const [reasoningEffort, setReasoningEffort] = useState<
    "none" | "low" | "medium" | "high"
  >("none");
  // Web search is on by default; users can opt out and the choice persists.
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [greetingCategory, setGreetingCategory] =
    useState<GreetingCategoryKey>("explore");
  const [autoRouterEnabled, setAutoRouterEnabled] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [viewerAttachment, setViewerAttachment] =
    useState<PendingAttachment | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const { isAuthenticated } = useConvexAuth();
  const chatT = useTranslations("Chat");
  const creditsStatus = useQuery(
    api.credits.getCreditsStatus,
    isAuthenticated ? {} : "skip",
  );
  const balance = creditsStatus?.balance ?? initialBalance;
  const nextResetAt = creditsStatus?.nextResetAt ?? null;
  const planName = creditsStatus?.planName ?? "free";
  const usableModels = useMemo(
    () => models.filter((model) => model.can_use !== false),
    [models],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_MODEL_KEY);
    if (saved && usableModels.some((m) => m.model_id === saved)) {
      setModelId(saved);
    }

    const savedReasoning = window.localStorage.getItem(STORAGE_REASONING_KEY);
    if (
      savedReasoning === "none" ||
      savedReasoning === "low" ||
      savedReasoning === "medium" ||
      savedReasoning === "high"
    ) {
      setReasoningEffort(savedReasoning);
    }
  }, [usableModels]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_MODEL_KEY, modelId);
  }, [modelId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_REASONING_KEY, reasoningEffort);
  }, [reasoningEffort]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_AUTO_KEY);
    if (saved === "1") setAutoRouterEnabled(true);

    const savedWebSearch = window.localStorage.getItem(STORAGE_WEBSEARCH_KEY);
    if (savedWebSearch === "0") setWebSearchEnabled(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_AUTO_KEY,
      autoRouterEnabled ? "1" : "0",
    );
  }, [autoRouterEnabled]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_WEBSEARCH_KEY,
      webSearchEnabled ? "1" : "0",
    );
  }, [webSearchEnabled]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || !shouldAutoScrollRef.current) return;
    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: streaming ? "auto" : "smooth",
    });
  }, [messages, streaming]);

  useEffect(() => {
    // Auto-grow textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = Math.min(textarea.scrollHeight, 12 * 16); // max 12rem (192px)
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const selectedModel = useMemo(
    () => models.find((m) => m.model_id === modelId),
    [models, modelId],
  );
  useEffect(() => {
    if (selectedModel?.can_use === false) {
      const fallback =
        usableModels.find((model) => model.category === "standard")?.model_id ??
        usableModels[0]?.model_id;
      if (fallback) {
        setModelId(fallback);
      }
    }
  }, [selectedModel, usableModels]);
  const supportsReasoning = selectedModel?.supports_reasoning ?? false;
  const providerGroups = useMemo(
    () =>
      Array.from(new Set(models.map((model) => model.provider)))
        .sort((a, b) => {
          const rankDiff = getProviderSortRank(a) - getProviderSortRank(b);
          return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
        })
        .map((provider) => ({
          provider,
          items: models
            .filter((model) => model.provider === provider)
            .sort((a, b) => a.sort_order - b.sort_order),
        })),
    [models],
  );
  const capabilityPills = useMemo(() => {
    if (!selectedModel) return [];
    const text =
      `${selectedModel.display_name} ${selectedModel.model_id} ${selectedModel.context_description ?? ""}`.toLowerCase();
    const pills: Array<{ key: string; label: string; icon: typeof Brain }> = [];

    if (selectedModel.supports_files) {
      pills.push({ key: "files", label: "Attach", icon: Paperclip });
    }
    if (
      text.includes("image") ||
      text.includes("vision") ||
      selectedModel.model_id.includes("vision")
    ) {
      pills.push({ key: "vision", label: "Vision", icon: Eye });
    }
    if (
      selectedModel.category === "advanced" ||
      selectedModel.category === "premium" ||
      selectedModel.category === "elite" ||
      text.includes("reason")
    ) {
      pills.push({ key: "reasoning", label: "Reasoning", icon: Brain });
    }

    return pills.slice(0, 3);
  }, [selectedModel]);
  const cost = selectedModel?.credit_cost_per_message ?? 0;
  const isFreeModel = selectedModel?.is_free ?? false;
  const documentReadyModel = useMemo(
    () =>
      usableModels.find((model) => model.supports_files) ??
      usableModels[0] ??
      null,
    [usableModels],
  );
  const visionReadyModel = useMemo(
    () =>
      usableModels.find(
        (model) => model.supports_files && model.supports_vision,
      ) ??
      usableModels.find((model) => model.supports_vision) ??
      null,
    [usableModels],
  );
  const hasUnsupportedImageAttachment =
    attachments.some((attachment) => attachment.kind === "image") &&
    !(selectedModel?.supports_vision ?? false);
  const hasUnsupportedPdfAttachment =
    attachments.some((attachment) => attachment.kind === "pdf") &&
    !(selectedModel?.supports_files ?? false);
  const canSend =
    !streaming &&
    input.trim().length > 0 &&
    !hasUnsupportedImageAttachment &&
    !hasUnsupportedPdfAttachment &&
    (isFreeModel || balance >= cost);
  const conversationLabel = useMemo(
    () => getConversationLabel(messages),
    [messages],
  );
  const latestAssistantIndex = useMemo(
    () =>
      [...messages]
        .map((message, index) => ({ message, index }))
        .reverse()
        .find(({ message }) => message.role === "assistant")?.index ?? -1,
    [messages],
  );

  useEffect(() => {
    if (!selectedModel) {
      setModelId(defaultModelId);
      return;
    }
    if (!supportsReasoning && reasoningEffort !== "none") {
      setReasoningEffort("none");
    }
  }, [
    defaultModelId,
    reasoningEffort,
    selectedModel,
    supportsReasoning,
  ]);

  async function send(
    prompt: string,
    regenerateLast = false,
    overrideModelId?: string,
    messageAttachments: PendingAttachment[] = [],
  ) {
    if (!prompt.trim()) return;
    setError(null);
    const activeModelId = overrideModelId ?? modelId;

    const userTempId = crypto.randomUUID();
    const assistantTempId = crypto.randomUUID();

    const baseMessages: UiMessage[] = regenerateLast
      ? messages.filter(
          (m, idx) => !(m.role === "assistant" && idx === messages.length - 1),
        )
      : messages;

    const next: UiMessage[] = regenerateLast
      ? [
          ...baseMessages,
          {
            id: assistantTempId,
            role: "assistant",
            content: "",
            pending: true,
          },
        ]
      : [
          ...baseMessages,
          {
            id: userTempId,
            role: "user",
            content: prompt,
            attachments: messageAttachments,
          },
          {
            id: assistantTempId,
            role: "assistant",
            content: "",
            pending: true,
          },
        ];
    setMessages(next);
    setStreaming(true);
    shouldAutoScrollRef.current = true;

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          model_id: activeModelId,
          message: prompt,
          regenerate: regenerateLast,
          reasoning_effort: supportsReasoning ? reasoningEffort : "none",
          web_search: webSearchEnabled,
          auto: autoRouterEnabled,
          attachments: messageAttachments.map((attachment) => ({
            name: attachment.name,
            kind: attachment.kind,
            media_type: attachment.mediaType,
            data_url: attachment.dataUrl,
          })),
        }),
        signal: ac.signal,
      });

      if (!resp.ok || !resp.body) {
        const detail = await resp
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(detail.error || `HTTP ${resp.status}`);
      }

      const newChatId = resp.headers.get("x-chat-id");
      if (newChatId && newChatId !== chatId) {
        setChatId(newChatId);
        // Rewrite the URL without a navigation so the assistant text keeps streaming
        window.history.replaceState({}, "", `/chat/${newChatId}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let reasoningText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.type === "reasoning" && typeof obj.text === "string") {
              reasoningText += obj.text;
              setMessages((cur) =>
                cur.map((m) =>
                  m.id === assistantTempId
                    ? { ...m, reasoning: reasoningText, pending: true }
                    : m,
                ),
              );
            } else if (obj.type === "delta" && typeof obj.text === "string") {
              assistantText += obj.text;
              setMessages((cur) =>
                cur.map((m) =>
                  m.id === assistantTempId
                    ? { ...m, content: assistantText, pending: true }
                    : m,
                ),
              );
            } else if (obj.type === "citations" && Array.isArray(obj.items)) {
              const incoming = (obj.items as MessageCitation[]).filter(
                (c) => typeof c?.url === "string" && c.url.length > 0,
              );
              if (incoming.length > 0) {
                setMessages((cur) =>
                  cur.map((m) => {
                    if (m.id !== assistantTempId) return m;
                    const existing = m.citations ?? [];
                    const seen = new Set(existing.map((c) => c.url));
                    const merged = [...existing];
                    for (const c of incoming) {
                      if (seen.has(c.url)) continue;
                      seen.add(c.url);
                      merged.push(c);
                    }
                    return { ...m, citations: merged };
                  }),
                );
              }
            } else if (obj.type === "model" && typeof obj.model === "string") {
              // Auto router told us which model it picked — stamp it onto
              // the in-flight message so the user can see the choice live.
              setMessages((cur) =>
                cur.map((m) =>
                  m.id === assistantTempId
                    ? { ...m, model_id: obj.model }
                    : m,
                ),
              );
            } else if (obj.type === "error") {
              throw new Error(obj.error || "Stream error");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setMessages((cur) =>
        cur.map((m) =>
          m.id === assistantTempId ? { ...m, pending: false } : m,
        ),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      // If aborted by user, we keep whatever streamed
      if ((e as Error)?.name === "AbortError") {
        setMessages((cur) =>
          cur.map((m) =>
            m.id === assistantTempId ? { ...m, pending: false } : m,
          ),
        );
      } else {
        setMessages((cur) => cur.filter((m) => m.id !== assistantTempId));
        setError(msg);
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    const prompt = input;
    const sentAttachments = attachments;
    setInput("");
    setAttachments([]);
    await send(prompt, false, undefined, sentAttachments);
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const nextFiles = Array.from(files).slice(0, 4 - attachments.length);
    const hasNewImage = nextFiles.some((file) => file.type.startsWith("image/"));
    const hasNewPdf = nextFiles.some(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );

    if (hasNewImage && !(selectedModel?.supports_vision ?? false) && visionReadyModel) {
      setModelId(visionReadyModel.model_id);
    } else if (
      hasNewPdf &&
      !(selectedModel?.supports_files ?? false) &&
      documentReadyModel
    ) {
      setModelId(documentReadyModel.model_id);
    }

    const resolved = await Promise.all(
      nextFiles.map(
        (file) =>
          new Promise<PendingAttachment | null>((resolve) => {
            if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
              setError(`${file.name} is too large. Keep uploads under 8 MB.`);
              resolve(null);
              return;
            }
            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
            const isImage = file.type.startsWith("image/");
            if (!isPdf && !isImage) {
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== "string") {
                resolve(null);
                return;
              }
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                kind: isPdf ? "pdf" : "image",
                mediaType: file.type || (isPdf ? "application/pdf" : "image/*"),
                dataUrl: reader.result,
              });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          }),
      ),
    );
    setAttachments((current) => [
      ...current,
      ...resolved.filter((attachment): attachment is PendingAttachment => attachment !== null),
    ]);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  function onStop() {
    abortRef.current?.abort();
  }

  async function onRegenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    await send(lastUser.content, true, undefined, lastUser.attachments ?? []);
  }

  function getRetryPrompt(assistantIndex: number) {
    for (let i = assistantIndex - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") {
        return {
          content: messages[i]?.content ?? "",
          attachments: messages[i]?.attachments ?? [],
        };
      }
    }
    return null;
  }

  async function retryAssistant(assistantIndex: number, nextModelId?: string) {
    const retryPayload = getRetryPrompt(assistantIndex);
    if (!retryPayload || streaming) return;

    const targetModelId = nextModelId ?? modelId;
    if (targetModelId !== modelId) {
      window.localStorage.setItem(STORAGE_MODEL_KEY, targetModelId);
      setModelId(targetModelId);
    }

    await send(
      retryPayload.content,
      true,
      targetModelId,
      retryPayload.attachments,
    );
  }

  async function onCopy(id: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  }

  const insufficient = !streaming && !isFreeModel && cost > balance;
  const resetDateLabel = nextResetAt
    ? new Date(nextResetAt).toLocaleDateString(undefined, { dateStyle: "medium" })
    : null;
  const freeModelOption = useMemo(
    () => usableModels.find((model) => model.is_free) ?? null,
    [usableModels],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div
        ref={scrollRef}
        onScroll={(event) => {
          const target = event.currentTarget;
          const distanceFromBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight;
          shouldAutoScrollRef.current =
            distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
        }}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
      >
        <div className="mx-auto w-full max-w-4xl px-8 pb-6 pt-10">
          {messages.length === 0 && (
            <div
              className={cn(
                "mt-20 transition-[opacity,transform] duration-300 ease-out",
                input.trim().length > 0
                  ? "pointer-events-none -translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100",
              )}
              aria-hidden={input.trim().length > 0}
            >
              <h2 className="text-4xl font-semibold tracking-tight">
                {chatT("greetingHeading")}
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {GREETING_CATEGORIES.map(({ key, icon: Icon }) => {
                  const active = greetingCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGreetingCategory(key)}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border/60 bg-secondary/50 text-foreground/70 hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {chatT(`greetingCategories.${key}`)}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-col">
                {(chatT.raw(`greetingPrompts.${greetingCategory}`) as string[]).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="w-fit px-2 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {messages.map((m, idx) => (
              <div
                key={m.id}
                data-no-translate
                className={cn(
                  "animate-fade-in",
                  m.role === "user"
                    ? "ml-auto w-fit max-w-[75%] rounded-2xl bg-accent px-4 py-2.5 text-sm text-accent-foreground"
                    : "max-w-full px-1 py-1",
                )}
              >
                {m.role === "assistant" ? (
                  <>
                    {/* Thinking block */}
                    {(m.reasoning || (m.pending && !m.content)) && (
                      <ThinkingBlock
                        reasoning={m.reasoning ?? ""}
                        isStreaming={!!m.pending}
                      />
                    )}
                    <div className="max-w-3xl text-foreground dark:text-white">
                      <Markdown
                        content={
                          m.content || (m.pending && !m.reasoning ? "◍" : "")
                        }
                      />
                    </div>
                    {m.citations && m.citations.length > 0 && (
                      <SourcesBlock citations={m.citations} />
                    )}
                    {!m.pending && m.content && (
                      <div className="mt-3 flex items-center gap-2">
                        {m.model_id && (
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
                            {models.find((mo) => mo.model_id === m.model_id)
                              ?.display_name ?? m.model_id}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(m.id, m.content)}
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </>
                          )}
                        </Button>
                        {idx === latestAssistantIndex && (
                          <RetryMenu
                            currentModel={
                              models.find(
                                (model) =>
                                  model.model_id === (m.model_id ?? modelId),
                              ) ??
                              selectedModel ??
                              null
                            }
                            groups={providerGroups}
                            disabled={streaming}
                            onRetrySame={() => retryAssistant(idx)}
                            onRetryWithModel={(nextModel) =>
                              retryAssistant(idx, nextModel)
                            }
                          />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {m.attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => setViewerAttachment(attachment)}
                            className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 p-3 text-left transition-colors hover:bg-background"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                              {attachment.kind === "image" ? (
                                <Eye className="h-5 w-5" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-foreground">
                                {attachment.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {attachment.kind === "image"
                                  ? "Image preview"
                                  : "Document preview"}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      {insufficient && (
        <div className="mx-auto w-full max-w-4xl px-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">You're out of credits.</div>
              <div className="mt-1 text-xs leading-5 text-foreground/80">
                {resetDateLabel
                  ? `Your monthly credits reset on ${resetDateLabel}.`
                  : planName === "free"
                    ? "Free plans don't auto-reset — upgrade to keep using paid models."
                    : "Upgrade or buy a credit add-on to keep chatting."}
                {freeModelOption && (
                  <>
                    {" "}
                    In the meantime,{" "}
                    <button
                      type="button"
                      onClick={() => setModelId(freeModelOption.model_id)}
                      className="font-medium underline underline-offset-2"
                    >
                      switch to {freeModelOption.display_name}
                    </button>{" "}
                    — it's free with no credit cost.
                  </>
                )}
              </div>
            </div>
            <a
              href="/settings?tab=billing"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade now
            </a>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex-shrink-0 bg-background px-6 pb-5 pt-3"
      >
        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-card/80 px-4 pb-2 pt-3">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground"
                >
                  {attachment.kind === "image" ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <Paperclip className="h-3.5 w-3.5" />
                  )}
                  <span className="max-w-48 truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea row */}
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) onSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder={
                insufficient
                  ? `Need ${cost} credits — buy more or upgrade your plan`
                  : hasUnsupportedPdfAttachment
                    ? "This model can’t read PDFs. Switch to a document-ready model or remove the file."
                  : hasUnsupportedImageAttachment
                    ? "This model can’t read images. Switch to a vision model or remove the image."
                    : "Type your message here..."
              }
              disabled={streaming}
              maxLength={32000}
              className="min-h-12 max-h-48 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-2 text-base shadow-none outline-none ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            />
            <div className="flex shrink-0 items-center gap-1 pb-1">
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  selectedModel?.supports_vision
                    ? "application/pdf,image/*"
                    : "application/pdf"
                }
                multiple
                className="hidden"
                onChange={(event) => {
                  void onPickFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
              <InstantTooltip
                content={
                  selectedModel?.supports_vision
                    ? "Upload PDFs or images"
                    : "Upload PDFs"
                }
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 rounded-full p-0 text-muted-foreground hover:text-foreground"
                  disabled={streaming || attachments.length >= 4}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </InstantTooltip>
              {streaming ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onStop}
                  className="h-9 w-9 rounded-full p-0 text-muted-foreground hover:text-foreground"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canSend}
                  className="h-9 w-9 rounded-full p-0"
                  variant="default"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Toolbar row */}
          <div className="flex min-w-0 items-center gap-1">
            {/* Model selector hides smoothly when Auto is on; OpenRouter
                picks the model so showing one would be misleading. */}
            <div
              className={cn(
                "min-w-0 shrink overflow-hidden transition-[max-width,opacity,margin,transform] duration-300 ease-out",
                autoRouterEnabled
                  ? "pointer-events-none -ml-1 max-w-0 -translate-x-1 opacity-0"
                  : "max-w-[18rem] translate-x-0 opacity-100",
              )}
              aria-hidden={autoRouterEnabled}
            >
              <ModelSelector
                models={models}
                selectedId={modelId}
                onSelect={setModelId}
                disabled={streaming}
                inline
              />
            </div>
            {/* Action pills never shrink. Auto sits first so it visually
                replaces the model selector when toggled on. */}
            <div className="flex shrink-0 items-center gap-1">
              <TogglePill
                active={autoRouterEnabled}
                onClick={() => setAutoRouterEnabled((v) => !v)}
                icon={Sparkles}
                label="Auto"
                tooltip="We pick the best model for each message. May increase usage."
              />
              <ReasoningModeMenu
                value={reasoningEffort}
                onChange={setReasoningEffort}
                disabled={streaming}
                available={supportsReasoning}
              />
              <TogglePill
                active={webSearchEnabled}
                onClick={() => setWebSearchEnabled((v) => !v)}
                icon={Globe}
                label="Search"
              />
            </div>
          </div>
        </div>
      </form>
      <AttachmentViewer
        attachment={viewerAttachment}
        onOpenChange={(open) => {
          if (!open) setViewerAttachment(null);
        }}
      />
    </div>
  );
}

function ReasoningModeMenu({
  value,
  onChange,
  disabled,
  available,
}: {
  value: "none" | "low" | "medium" | "high";
  onChange: (value: "none" | "low" | "medium" | "high") => void;
  disabled: boolean;
  available: boolean;
}) {
  const labels: Record<typeof value, string> = {
    none: "Off",
    low: "Fast",
    medium: "Balanced",
    high: "Deep",
  };

  const trigger = (
    <Button
      variant="ghost"
      disabled={disabled}
      className={cn(
        "h-10 rounded-full border border-border/70 bg-background px-4 text-sm",
        available
          ? "text-foreground/80 hover:bg-accent/60"
          : "cursor-not-allowed text-muted-foreground/45 hover:bg-background",
      )}
    >
      <SlidersHorizontal className="h-4 w-4" />
      {labels[value]}
    </Button>
  );

  if (!available) {
    return (
      <InstantTooltip content="Not available for this model">
        <span>{trigger}</span>
      </InstantTooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {(["low", "medium", "high"] as const).map((option) => (
          <DropdownMenuItem key={option} onSelect={() => onChange(option)}>
            {labels[option]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TogglePill({
  active,
  onClick,
  icon: Icon,
  label,
  available = true,
  tooltip,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Globe;
  label: string;
  available?: boolean;
  tooltip?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={() => {
        if (!available) return;
        onClick();
      }}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-sm transition-colors",
        !available
          ? "cursor-not-allowed text-muted-foreground/45"
          : active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
      aria-disabled={!available}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );

  if (!available) {
    return <InstantTooltip content="Not available for this model">{button}</InstantTooltip>;
  }
  if (tooltip) {
    return <InstantTooltip content={tooltip}>{button}</InstantTooltip>;
  }

  return button;
}

function RetryMenu({
  currentModel,
  groups,
  disabled,
  onRetrySame,
  onRetryWithModel,
}: {
  currentModel: AppModel | null;
  groups: Array<{ provider: string; items: AppModel[] }>;
  disabled: boolean;
  onRetrySame: () => void;
  onRetryWithModel: (modelId: string) => void;
}) {
  // Each provider row is collapsible. Default expanded so a tap-and-pick
  // flow still works in one click; users can collapse providers they don't
  // care about to scan the list faster.
  const [collapsedProviders, setCollapsedProviders] = useState<Set<string>>(
    () => new Set(),
  );
  function toggleProvider(provider: string) {
    setCollapsedProviders((current) => {
      const next = new Set(current);
      if (next.has(provider)) next.delete(provider);
      else next.add(provider);
      return next;
    });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
          {currentModel && (
            <span className="hidden text-muted-foreground sm:inline">
              {currentModel.display_name}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-2"
      >
        <DropdownMenuItem
          onSelect={onRetrySame}
          className="rounded-xl px-3 py-3"
        >
          <RotateCcw className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Retry same</span>
            {currentModel && (
              <span className="text-xs text-muted-foreground">
                {currentModel.display_name}
              </span>
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-0 my-2" />
        <DropdownMenuLabel className="px-3">Or switch model</DropdownMenuLabel>
        <div className="max-h-72 overflow-y-auto scrollbar-thin">
          {groups.map((group) => {
            const collapsed = collapsedProviders.has(group.provider);
            return (
              <div key={group.provider}>
                <button
                  type="button"
                  onClick={() => toggleProvider(group.provider)}
                  aria-expanded={!collapsed}
                  className="flex w-full items-center gap-1.5 rounded-md px-3 pt-3 pb-1 text-left text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 shrink-0 transition-transform duration-200",
                      collapsed && "-rotate-90",
                    )}
                  />
                  <span>{group.provider}</span>
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground/55">
                    {group.items.length}
                  </span>
                </button>
                        {!collapsed &&
                          group.items.map((model) => (
                    <DropdownMenuItem
                      key={model.model_id}
                      onSelect={() => onRetryWithModel(model.model_id)}
                      className="rounded-xl px-3 py-2.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate font-medium">
                          {model.display_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {model.credit_cost_per_message} cr
                        </span>
                      </div>
                      {currentModel?.model_id === model.model_id ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SourcesBlock({ citations }: { citations: MessageCitation[] }) {
  const formatHost = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };
  return (
    <div className="mt-4 border-t border-border/40 pt-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
        Sources
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((citation, idx) => {
          const host = formatHost(citation.url);
          const label = citation.title?.trim() || host;
          return (
            <a
              key={`${citation.url}-${idx}`}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              title={citation.title || citation.url}
              className="group inline-flex max-w-full items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground/70 group-hover:bg-primary/15 group-hover:text-foreground">
                {idx + 1}
              </span>
              <span className="truncate font-medium text-foreground/85">
                {label}
              </span>
              <span className="hidden truncate text-muted-foreground/70 sm:inline">
                {host}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ThinkingBlock({
  reasoning,
  isStreaming,
}: {
  reasoning: string;
  isStreaming: boolean;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!isStreaming) {
      setOpen(false);
    }
  }, [isStreaming]);

  const showShimmer = isStreaming && !reasoning;

  return (
    <div className="mb-3 max-w-2xl text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-1.5 text-left"
      >
        {showShimmer ? (
          <SquigglyText
            scale={[2, 3]}
            stepDuration={90}
            baseFrequency={0.04}
            className="text-sm font-medium text-foreground/55"
          >
            Thinking
          </SquigglyText>
        ) : (
          <span className="text-sm font-medium text-foreground/45 transition-colors group-hover:text-foreground/70">
            Thought process
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-foreground/40 transition-transform duration-200 group-hover:text-foreground/70",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open && reasoning && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/45">
          {reasoning}
          {isStreaming && <span className="animate-pulse">▍</span>}
        </p>
      )}
    </div>
  );
}

function AttachmentViewer({
  attachment,
  onOpenChange,
}: {
  attachment: PendingAttachment | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={!!attachment} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[85vh] w-[min(92vw,70rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-lg font-semibold text-foreground">
                {attachment?.name ?? "Preview"}
              </Dialog.Title>
              <p className="text-sm text-muted-foreground">
                {attachment?.kind === "image" ? "Image" : "Document"}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 bg-secondary/20 p-4">
            {attachment?.kind === "image" ? (
              <div className="flex h-full items-center justify-center overflow-auto rounded-[1.5rem] bg-background p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="max-h-full max-w-full rounded-2xl object-contain"
                />
              </div>
            ) : attachment ? (
              <iframe
                src={attachment.dataUrl}
                title={attachment.name}
                className="h-full w-full rounded-[1.5rem] border border-border/50 bg-white"
              />
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
