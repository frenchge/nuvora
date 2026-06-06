import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Refresh the model catalog from OpenRouter's live list once a day so new chat
// models from our supported providers appear automatically — no manual run
// needed. `syncOpenRouterCatalog` already filters to chat-only models and to
// the providers in POPULAR_PROVIDER_SET, so this never adds new providers; it
// just keeps every chat model from the ones we already have up to date.
crons.interval(
  "sync model catalog",
  { hours: 24 },
  api.models.syncOpenRouterCatalog,
  {},
);

export default crons;
