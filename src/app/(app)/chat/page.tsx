import { ChatClient } from "@/components/chat/chat-client";
import { api } from "@convex/_generated/api";
import { fetchQuery, getRequiredConvexToken } from "@/lib/convex-server";
import { POPULAR_PROVIDER_SET } from "@/lib/model-providers";

export const dynamic = "force-dynamic";

export default async function NewChatPage() {
  const token = await getRequiredConvexToken();
  const [models, balance] = await Promise.all([
    fetchQuery(api.models.listAvailable, {}, { token }),
    fetchQuery(api.credits.getBalance, {}, { token }),
  ]);
  const catalog = (models ?? []).filter((m) => POPULAR_PROVIDER_SET.has(m.provider));
  const usable = catalog.filter((m) => m.can_use !== false);

  const defaultModel =
    usable.find((m) => m.category === "standard")?.model_id ??
    usable[0]?.model_id ??
    catalog.find((m) => m.category === "standard")?.model_id ??
    catalog[0]?.model_id ??
    "openai/gpt-4.1-mini";

  return (
    <ChatClient
      initialChatId={null}
      initialMessages={[]}
      models={catalog}
      initialBalance={balance}
      defaultModelId={defaultModel}
    />
  );
}
