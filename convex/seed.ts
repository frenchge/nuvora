import { mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";
import { DEFAULT_MODELS, defaultPlanConfigs } from "./defaults";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const existingPlans = await ctx.db.query("plans").collect();
    const existingModels = await ctx.db.query("models").collect();
    if (existingPlans.length > 0 || existingModels.length > 0) {
      await requireAdmin(ctx);
    }

    for (const plan of defaultPlanConfigs()) {
      const existing = await ctx.db
        .query("plans")
        .withIndex("by_name", (q) => q.eq("name", plan.name))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, plan);
      } else {
        await ctx.db.insert("plans", plan);
      }
    }

    for (const model of DEFAULT_MODELS) {
      const existing = await ctx.db
        .query("models")
        .withIndex("by_model_id", (q) => q.eq("model_id", model.model_id))
        .unique();
      const payload = {
        model_id: model.model_id,
        display_name: model.display_name,
        provider: model.provider,
        category: model.category,
        credit_cost_per_message: model.credit_cost_per_message,
        enabled: model.enabled,
        supports_streaming: model.supports_streaming,
        supports_files: model.supports_files,
        supports_vision: model.supports_vision ?? false,
        supports_reasoning: model.supports_reasoning ?? false,
        supports_tools: model.supports_tools ?? false,
        supports_web_search: model.supports_web_search ?? false,
        context_length: model.context_length,
        context_description: model.context_description,
        admin_notes: model.admin_notes,
        free_plan_allowed: model.free_plan_allowed,
        estimated_cost_per_message_usd: model.estimated_cost_per_message_usd,
        sort_order: model.sort_order,
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("models", payload);
      }
    }

    return {
      plansSeeded: defaultPlanConfigs().length,
      modelsSeeded: DEFAULT_MODELS.length,
    };
  },
});
