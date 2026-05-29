import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Convex auto-tracks _creationTime — no need for created_at columns.
// All `user_id` fields hold the Clerk user id (string).

export default defineSchema({
  users_profile: defineTable({
    user_id: v.string(),
    full_name: v.optional(v.string()),
    email: v.optional(v.string()),
    preferred_language: v.optional(v.string()),
    preferred_currency: v.optional(v.string()),
    plan_name: v.string(), // "free" | "basic" | "starter" | "pro"
    stripe_customer_id: v.optional(v.string()),
    is_admin: v.boolean(),
    admin_discount_percent: v.optional(v.number()),
    admin_discount_note: v.optional(v.string()),
    pending_plan_welcome: v.optional(v.string()),
    // ms-epoch deadline when a failed-payment grace period ends. While this
    // is set and in the future, we keep the user on their paid plan and
    // surface a "fix your payment" banner. After that, a scheduled action
    // downgrades the plan to free.
    payment_grace_until: v.optional(v.number()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_stripe_customer", ["stripe_customer_id"])
    .index("by_email", ["email"]),

  plans: defineTable({
    name: v.string(),
    monthly_price: v.number(),
    monthly_credits: v.number(),
    trees_per_month: v.number(),
    daily_message_limit: v.number(),
    messages_per_2h_limit: v.optional(v.number()),
    monthly_api_budget_usd: v.number(),
    max_message_length: v.number(),
    max_conversation_length: v.number(),
    max_file_uploads_per_day: v.number(),
    is_active: v.boolean(),
  }).index("by_name", ["name"]),

  subscriptions: defineTable({
    user_id: v.string(),
    stripe_subscription_id: v.string(),
    plan_name: v.string(),
    status: v.string(),
    current_period_start: v.optional(v.number()), // ms epoch
    current_period_end: v.optional(v.number()),
    cancel_at_period_end: v.boolean(),
  })
    .index("by_user", ["user_id"])
    .index("by_stripe_id", ["stripe_subscription_id"]),

  // Append-only ledger. Balance = sum(amount).
  credits_ledger: defineTable({
    user_id: v.string(),
    amount: v.number(), // signed
    type: v.string(), // grant | addon | deduction | refund | admin_adjust
    description: v.optional(v.string()),
    related_message_id: v.optional(v.id("messages")),
  }).index("by_user", ["user_id"]),

  chats: defineTable({
    user_id: v.string(),
    title: v.string(),
    last_activity: v.number(), // ms epoch — explicit so we can patch it on send
    pinned: v.optional(v.boolean()),
  })
    .index("by_user_activity", ["user_id", "last_activity"])
    .searchIndex("by_user_title", {
      searchField: "title",
      filterFields: ["user_id"],
    }),

  messages: defineTable({
    chat_id: v.id("chats"),
    user_id: v.string(),
    role: v.string(), // user | assistant | system
    content: v.string(),
    model_id: v.optional(v.string()),
    credits_used: v.number(),
    estimated_api_cost: v.number(),
    // url_citation annotations attached to assistant replies that used
    // web search. Rendered as a "Sources" block under the message.
    citations: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.optional(v.string()),
          content: v.optional(v.string()),
        }),
      ),
    ),
  })
    .index("by_chat", ["chat_id"])
    .index("by_user", ["user_id"]),

  models: defineTable({
    model_id: v.string(),
    display_name: v.string(),
    provider: v.string(),
    category: v.string(), // small | standard | advanced | premium | elite
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
  }).index("by_model_id", ["model_id"]),

  api_usage: defineTable({
    user_id: v.string(),
    chat_id: v.optional(v.id("chats")),
    message_id: v.optional(v.id("messages")),
    provider: v.string(),
    model_id: v.string(),
    credits_charged: v.number(),
    estimated_api_cost: v.number(),
    prompt_tokens: v.optional(v.number()),
    completion_tokens: v.optional(v.number()),
    status: v.string(), // ok | error | partial
    error_message: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_model", ["model_id"]),

  tree_planting_obligations: defineTable({
    user_id: v.string(),
    subscription_id: v.optional(v.id("subscriptions")),
    month: v.string(), // canonical "YYYY-MM-01"
    trees_promised: v.number(),
    cost_per_tree: v.number(),
    total_cost: v.number(),
    status: v.string(), // pending | fulfilled | cancelled
    fulfilled_at: v.optional(v.number()),
  })
    .index("by_user_month", ["user_id", "month"])
    .index("by_month", ["month"]),

  payments: defineTable({
    user_id: v.string(),
    stripe_payment_id: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    type: v.string(), // subscription | addon
    status: v.string(),
    description: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_stripe_id", ["stripe_payment_id"]),

  contribution_events: defineTable({
    user_id: v.string(),
    payment_id: v.optional(v.id("payments")),
    stripe_payment_id: v.optional(v.string()),
    amount: v.number(),
    amount_usd: v.number(),
    currency: v.string(),
    source_type: v.string(), // subscription | addon
    plan_name: v.optional(v.string()), // plan paid for, used to drive allocations
    status: v.string(), // pending | fulfilled | failed
    attribution: v.string(),
    fulfilled_at: v.optional(v.number()),
    fulfilled_by: v.optional(v.string()),
    fulfilled_note: v.optional(v.string()),
    error_message: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_payment", ["payment_id"])
    .index("by_stripe_id", ["stripe_payment_id"]),

  contribution_allocations: defineTable({
    contribution_event_id: v.id("contribution_events"),
    user_id: v.string(),
    payment_id: v.optional(v.id("payments")),
    initiative_id: v.string(),
    initiative_label: v.string(),
    api_kind: v.string(), // trees | plastic
    amount_usd: v.number(),
    unit_cost_usd: v.number(),
    units_requested: v.number(),
    units_delivered: v.number(),
    unit_label: v.string(),
    external_ids: v.optional(v.array(v.string())),
    idempotency_key: v.string(),
    attribution: v.string(),
    status: v.string(), // pending | fulfilled | failed
    fulfilled_at: v.optional(v.number()),
    error_message: v.optional(v.string()),
  })
    .index("by_user", ["user_id"])
    .index("by_contribution", ["contribution_event_id"])
    .index("by_payment", ["payment_id"]),

  admin_settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  blog_posts: defineTable({
    locale: v.string(),
    status: v.string(), // draft | published
    slug: v.string(),
    title: v.string(),
    seo_title: v.string(),
    meta_description: v.string(),
    excerpt: v.string(),
    body_markdown: v.string(),
    author_name: v.string(),
    tags: v.array(v.string()),
    cover_image_url: v.optional(v.string()),
    published_at: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status_and_published_at", ["status", "published_at"]),

  blog_post_translations: defineTable({
    post_id: v.id("blog_posts"),
    locale: v.string(),
    title: v.string(),
    seo_title: v.string(),
    meta_description: v.string(),
    excerpt: v.string(),
    body_markdown: v.string(),
    tags: v.array(v.string()),
    updated_at: v.number(),
  }).index("by_post_id_and_locale", ["post_id", "locale"]),
});
