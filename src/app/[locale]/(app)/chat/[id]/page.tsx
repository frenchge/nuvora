import { notFound } from "next/navigation";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { ChatClient } from "@/components/chat/chat-client";
import { fetchQuery, getRequiredConvexToken } from "@/lib/convex-server";
import { POPULAR_PROVIDER_SET } from "@/lib/model-providers";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getRequiredConvexToken();
  const [thread, models, balance] = await Promise.all([
    fetchQuery(api.chats.getThread, { chatId: id as Id<"chats"> }, { token }),
    fetchQuery(api.models.listAvailable, {}, { token }),
    fetchQuery(api.credits.getBalance, {}, { token }),
  ]);
  if (!thread) notFound();
  const catalog = (models ?? []).filter((m) => POPULAR_PROVIDER_SET.has(m.provider));
  const usable = catalog.filter((m) => m.can_use !== false);

  const lastAssistantModel =
    [...thread.messages].reverse().find((m) => m.role === "assistant" && m.model_id)?.model_id;
  const usableLastAssistantModel =
    lastAssistantModel && usable.some((m) => m.model_id === lastAssistantModel)
      ? lastAssistantModel
      : undefined;

  const defaultModel =
    usableLastAssistantModel ??
    usable.find((m) => m.category === "standard")?.model_id ??
    usable[0]?.model_id ??
    lastAssistantModel ??
    catalog.find((m) => m.category === "standard")?.model_id ??
    catalog[0]?.model_id ??
    "openai/gpt-4.1-mini";

  return (
    <ChatClient
      initialChatId={id}
      initialMessages={thread.messages}
      models={catalog}
      initialBalance={balance}
      defaultModelId={defaultModel}
    />
  );
}
