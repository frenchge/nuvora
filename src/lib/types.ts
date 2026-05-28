export type PlanName = "free" | "basic" | "starter" | "pro";
export type ModelCategory =
  | "small"
  | "standard"
  | "advanced"
  | "premium"
  | "elite";

export interface Plan {
  id: string;
  name: PlanName;
  monthly_price: number;
  monthly_credits: number;
  trees_per_month: number;
  daily_message_limit: number;
  monthly_api_budget_usd: number;
  max_message_length: number;
  max_conversation_length: number;
  max_file_uploads_per_day: number;
  is_active: boolean;
  stripe_price_id: string | null;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  preferred_language: string;
  plan_name: PlanName;
  stripe_customer_id: string | null;
  is_admin: boolean;
  admin_discount_percent: number;
  admin_discount_note: string | null;
  pending_plan_welcome: PlanName | null;
  created_at: string;
  updated_at: string;
}

export interface AppModel {
  id: string;
  model_id: string;
  display_name: string;
  provider: string;
  category: ModelCategory;
  credit_cost_per_message: number;
  enabled: boolean;
  supports_streaming: boolean;
  supports_files: boolean;
  context_description: string | null;
  admin_notes: string | null;
  free_plan_allowed: boolean;
  is_free: boolean;
  estimated_cost_per_message_usd: number;
  sort_order: number;
  can_use?: boolean;
  supports_reasoning?: boolean;
  supports_vision?: boolean;
  supports_tools?: boolean;
  supports_web_search?: boolean;
  context_length?: number;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageCitation {
  url: string;
  title?: string;
  content?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model_id: string | null;
  credits_used: number;
  estimated_api_cost: number;
  citations: MessageCitation[] | null;
  created_at: string;
}
