import type { PlanName } from "./types";
import { PLAN_DISPLAY } from "./plans";

export type ContributionInitiativeId = "mangrove" | "arbor_day";
// Discriminator stored on allocations as `api_kind` (schema legacy name).
// Drives unit-counting and per-kind display rollups (trees vs. bottles).
export type ContributionUnitKind = "trees";

export type ContributionInitiative = {
  id: ContributionInitiativeId;
  label: string;
  region: string;
  description: string;
  unitLabel: string;
  unitCostUsd: number;
  unitKind: ContributionUnitKind;
};

export const CONTRIBUTION_INITIATIVES: ContributionInitiative[] = [
  {
    id: "mangrove",
    label: "Mangrove Trees",
    region: "Brazil & Kenya",
    description:
      "Partner-led mangrove restoration projects focused on long-term regeneration, resilient coastlines, and biodiversity recovery.",
    unitLabel: "tree",
    unitCostUsd: 0.43,
    unitKind: "trees",
  },
  {
    id: "arbor_day",
    label: "Native Forest Trees",
    region: "North America",
    description:
      "Large-scale native tree planting with verified planting records, species diversity, and long-term forest stewardship.",
    unitLabel: "tree",
    unitCostUsd: 1.5,
    unitKind: "trees",
  },
];

// Which initiatives each plan funds. Free mirrors basic so any incidental
// payment still produces a valid allocation.
export const PLAN_INITIATIVE_ELIGIBILITY: Record<
  PlanName,
  ContributionInitiativeId[]
> = {
  free: ["mangrove", "arbor_day"],
  basic: ["mangrove", "arbor_day"],
  starter: ["mangrove", "arbor_day"],
  pro: ["mangrove", "arbor_day"],
};

export function getInitiativesForPlan(
  plan: PlanName,
): ContributionInitiative[] {
  const eligible = new Set(PLAN_INITIATIVE_ELIGIBILITY[plan]);
  return CONTRIBUTION_INITIATIVES.filter((initiative) =>
    eligible.has(initiative.id),
  );
}

export function getPlanContributionTargets(plan: PlanName): Record<ContributionInitiativeId, number> {
  const empty: Record<ContributionInitiativeId, number> = {
    mangrove: 0,
    arbor_day: 0,
  };

  if (plan === "free") {
    return empty;
  }

  const trees = PLAN_DISPLAY[plan].trees;

  if (plan === "basic") {
    return {
      mangrove: Math.max(0, trees - 1),
      arbor_day: trees > 0 ? 1 : 0,
    };
  }

  const arborShare = Math.floor(trees / 5);
  return {
    mangrove: Math.max(0, trees - arborShare),
    arbor_day: arborShare,
  };
}

// Equal weights per tier — money is split evenly across the eligible services.
export function getTargetWeightsForPlan(
  plan: PlanName,
): Record<ContributionInitiativeId, number> {
  const initiatives = getInitiativesForPlan(plan);
  const share = initiatives.length === 0 ? 0 : 1 / initiatives.length;
  const weights = {} as Record<ContributionInitiativeId, number>;
  for (const initiative of CONTRIBUTION_INITIATIVES) {
    weights[initiative.id] = 0;
  }
  for (const initiative of initiatives) {
    weights[initiative.id] = share;
  }
  return weights;
}

export function getPlanContributionUsd(plan: PlanName): number {
  const targets = getPlanContributionTargets(plan);
  return Number(
    CONTRIBUTION_INITIATIVES.reduce((sum, initiative) => {
      const units = targets[initiative.id] ?? 0;
      return sum + units * initiative.unitCostUsd;
    }, 0).toFixed(2),
  );
}

export function convertCurrencyAmountToUsd(
  amount: number,
  currency: string,
): number {
  const normalized = currency.trim().toLowerCase();
  if (normalized === "usd") return amount;
  if (normalized === "eur") {
    const eurUsdRate = Number(process.env.EUR_USD_RATE ?? "1.08");
    return amount * eurUsdRate;
  }
  return amount;
}
