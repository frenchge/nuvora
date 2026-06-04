import type { Currency } from "./currency";
import type { PlanName } from "./types";

export const PLAN_ORDER: PlanName[] = ["free", "basic", "starter", "pro"];

export interface PlanDisplay {
  name: PlanName;
  label: string;
  price: number;
  credits: number;
  trees: number;
  bottles: number;
  highlighted?: boolean;
  features: string[];
}

export const PLAN_DISPLAY: Record<PlanName, PlanDisplay> = {
  free: {
    name: "free",
    label: "Free",
    price: 0,
    credits: 100,
    trees: 0,
    bottles: 0,
    features: [
      "100 credits / month",
      "Access to fast small models",
      "20 messages / day",
      "Community support",
    ],
  },
  basic: {
    name: "basic",
    label: "Basic",
    price: 19,
    credits: 10_000,
    trees: 5,
    bottles: 0,
    features: [
      "10,000 credits / month",
      "All paid AI models included",
      "150 messages / day",
      "Plants 5 trees every month",
      "Supports mangrove and native forest restoration",
    ],
  },
  starter: {
    name: "starter",
    label: "Starter",
    price: 39,
    credits: 20_000,
    trees: 15,
    bottles: 0,
    highlighted: true,
    features: [
      "20,000 credits / month",
      "All paid AI models included",
      "350 messages / day",
      "Plants 15 trees every month",
      "Priority routing",
    ],
  },
  pro: {
    name: "pro",
    label: "Pro",
    price: 69,
    credits: 35_000,
    trees: 30,
    bottles: 0,
    features: [
      "35,000 credits / month",
      "All paid AI models included",
      "700 messages / day",
      "Plants 30 trees every month",
      "Highest rate limits",
    ],
  },
};

export interface CreditAddon {
  key: string;
  credits: number;
  price: number;
  envVar: string;
}

export const CREDIT_ADDONS: CreditAddon[] = [
  { key: "5k",  credits: 5_000,  price: 7,  envVar: "STRIPE_PRICE_CREDITS_5K" },
  { key: "10k", credits: 10_000, price: 12, envVar: "STRIPE_PRICE_CREDITS_10K" },
  { key: "25k", credits: 25_000, price: 25, envVar: "STRIPE_PRICE_CREDITS_25K" },
  { key: "50k", credits: 50_000, price: 45, envVar: "STRIPE_PRICE_CREDITS_50K" },
];

export function planEnvPriceVar(
  plan: PlanName,
  currency: Currency = "EUR",
): string | null {
  const suffix = currency === "EUR" ? "" : `_${currency}`;
  switch (plan) {
    case "basic": return `STRIPE_PRICE_BASIC${suffix}`;
    case "starter":  return `STRIPE_PRICE_STARTER${suffix}`;
    case "pro":   return `STRIPE_PRICE_PRO${suffix}`;
    default: return null;
  }
}

export function addonEnvPriceVar(
  envVar: string,
  currency: Currency = "EUR",
): string {
  return currency === "EUR" ? envVar : `${envVar}_${currency}`;
}

export function isPaidPlan(plan: PlanName): boolean {
  return plan !== "free";
}

export const COST_PER_TREE_EUR = 0.8;

/**
 * How many USD we retain from every subscription payment after covering
 * the user's model usage budget. The remainder funds restoration
 * contributions via the Good API.
 *
 *   contribution = price - monthly_api_budget_usd - KEEP_USD
 */
export const KEEP_USD = 7;

export const PLAN_API_BUDGET_USD: Record<PlanName, number> = {
  free: 2,
  basic: 9,
  starter: 18,
  pro: 32,
};

export function getPlanContributionUsd(plan: PlanName): number {
  switch (plan) {
    case "basic":
      return Number((4 * 0.43 + 1 * 1.5).toFixed(2));
    case "starter":
      return Number((12 * 0.43 + 3 * 1.5).toFixed(2));
    case "pro":
      return Number((24 * 0.43 + 6 * 1.5).toFixed(2));
    default:
      return 0;
  }
}
