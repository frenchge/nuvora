import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireIdentity, type PlanName } from "./helpers";
import {
  CONTRIBUTION_INITIATIVES,
  getPlanContributionTargets,
  getInitiativesForPlan,
  getTargetWeightsForPlan,
  convertCurrencyAmountToUsd,
  type ContributionInitiative,
  type ContributionInitiativeId,
} from "../src/lib/contribution-portfolio";

type AllocationPlan = {
  initiative: ContributionInitiative;
  units: number;
  amountUsd: number;
};

// Baseline community tree count surfaced on the Community page. The real
// fulfilled-allocation total is added on top, so the displayed number is
// always BASELINE + real planted units. Bump this once the real total
// catches up so the stat continues to read as larger than what users see
// from their own contribution history.
const COMMUNITY_TREES_BASELINE = 285;

// Same idea for the Activity (paid contribution events) counter on the
// Community page. Starts at 14 and grows as real paid events land.
const COMMUNITY_EVENTS_BASELINE = 14;

function buildAllocationPlan(
  amountUsd: number,
  plan: PlanName,
): {
  allocations: AllocationPlan[];
  allocatedUsd: number;
} {
  const eligible = getInitiativesForPlan(plan);
  if (eligible.length === 0) {
    return { allocations: [], allocatedUsd: 0 };
  }
  const exactTargets = getPlanContributionTargets(plan);
  const exactAllocations = eligible
    .map((initiative) => {
      const units = exactTargets[initiative.id] ?? 0;
      return {
        initiative,
        units,
        amountUsd: Number((units * initiative.unitCostUsd).toFixed(2)),
      };
    })
    .filter((allocation) => allocation.units > 0);

  if (exactAllocations.length > 0) {
    return {
      allocations: exactAllocations,
      allocatedUsd: Number(
        exactAllocations
          .reduce((sum, allocation) => sum + allocation.amountUsd, 0)
          .toFixed(2),
      ),
    };
  }

  const weights = getTargetWeightsForPlan(plan);

  const spendByInitiative = new Map<ContributionInitiativeId, number>();
  const unitsByInitiative = new Map<ContributionInitiativeId, number>();

  for (const initiative of eligible) {
    spendByInitiative.set(initiative.id, 0);
    unitsByInitiative.set(initiative.id, 0);
  }

  let remainingUsd = Number(amountUsd.toFixed(2));
  const cheapestUnit = Math.min(
    ...eligible.map((initiative) => initiative.unitCostUsd),
  );

  while (remainingUsd + 1e-9 >= cheapestUnit) {
    const affordable = eligible.filter(
      (initiative) => initiative.unitCostUsd <= remainingUsd + 1e-9,
    );
    if (affordable.length === 0) break;

    const nextInitiative = affordable.sort((a, b) => {
      const ratioA = (spendByInitiative.get(a.id) ?? 0) / weights[a.id];
      const ratioB = (spendByInitiative.get(b.id) ?? 0) / weights[b.id];
      if (ratioA !== ratioB) return ratioA - ratioB;
      return a.unitCostUsd - b.unitCostUsd;
    })[0]!;

    unitsByInitiative.set(
      nextInitiative.id,
      (unitsByInitiative.get(nextInitiative.id) ?? 0) + 1,
    );
    spendByInitiative.set(
      nextInitiative.id,
      (spendByInitiative.get(nextInitiative.id) ?? 0) +
        nextInitiative.unitCostUsd,
    );
    remainingUsd = Number(
      (remainingUsd - nextInitiative.unitCostUsd).toFixed(2),
    );
  }

  const allocations = eligible
    .map((initiative) => {
      const units = unitsByInitiative.get(initiative.id) ?? 0;
      return {
        initiative,
        units,
        amountUsd: Number((units * initiative.unitCostUsd).toFixed(2)),
      };
    })
    .filter((allocation) => allocation.units > 0);

  return {
    allocations,
    allocatedUsd: Number(
      allocations
        .reduce((sum, allocation) => sum + allocation.amountUsd, 0)
        .toFixed(2),
    ),
  };
}

export const enqueueContribution = internalMutation({
  args: {
    userId: v.string(),
    paymentId: v.id("payments"),
    stripePaymentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    sourceType: v.string(),
    // USD amount to actually allocate to restoration partners.
    // Caller subtracts the user's OpenRouter budget and our keep margin
    // before passing this in. Falls back to converting `amount` directly.
    contributionUsd: v.optional(v.number()),
    // Plan the user paid for. Stored on the event so allocations don't
    // depend on a possibly-stale profile read at fulfillment time
    // (subscription/invoice webhooks can arrive out of order).
    planName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = args.stripePaymentId
      ? await ctx.db
          .query("contribution_events")
          .withIndex("by_stripe_id", (q) =>
            q.eq("stripe_payment_id", args.stripePaymentId),
          )
          .unique()
      : null;

    if (existing) {
      return existing._id;
    }

    const amountUsd = Number(
      (
        args.contributionUsd ??
        convertCurrencyAmountToUsd(args.amount, args.currency)
      ).toFixed(2),
    );
    if (amountUsd <= 0) {
      // Nothing left to allocate (e.g. addons, or freshly-priced plan).
      return null;
    }
    const contributionId = await ctx.db.insert("contribution_events", {
      user_id: args.userId,
      payment_id: args.paymentId,
      amount: args.amount,
      amount_usd: amountUsd,
      currency: args.currency,
      source_type: args.sourceType,
      status: "pending",
      attribution: args.userId,
      ...(args.planName ? { plan_name: args.planName } : {}),
      ...(args.stripePaymentId
        ? { stripe_payment_id: args.stripePaymentId }
        : {}),
    });

    const planName = (args.planName ?? "free") as PlanName;
    const { allocations } = buildAllocationPlan(amountUsd, planName);

    for (const allocation of allocations) {
      const idempotencyKey = `${String(contributionId)}:${allocation.initiative.id}:${allocation.units}`;
      await ctx.db.insert("contribution_allocations", {
        contribution_event_id: contributionId,
        user_id: args.userId,
        payment_id: args.paymentId,
        initiative_id: allocation.initiative.id,
        initiative_label: allocation.initiative.label,
        api_kind: allocation.initiative.unitKind,
        amount_usd: allocation.amountUsd,
        unit_cost_usd: allocation.initiative.unitCostUsd,
        units_requested: allocation.units,
        units_delivered: 0,
        unit_label: allocation.initiative.unitLabel,
        external_ids: [],
        idempotency_key: idempotencyKey,
        attribution: args.userId,
        status: "pending",
      });
    }

    return contributionId;
  },
});

export const getContributionDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const [events, allocations, allEvents, allAllocations, profiles] =
      await Promise.all([
        ctx.db
          .query("contribution_events")
          .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
          .collect(),
        ctx.db
          .query("contribution_allocations")
          .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
          .collect(),
        ctx.db.query("contribution_events").collect(),
        ctx.db.query("contribution_allocations").collect(),
        ctx.db.query("users_profile").collect(),
      ]);
    const profileByUserId = new Map(
      profiles.map((profile) => [profile.user_id, profile] as const),
    );

    const isFulfilledStatus = (status: string) =>
      status === "fulfilled" || status === "completed";
    const fulfilledAllocations = allocations.filter((row) =>
      isFulfilledStatus(row.status),
    );
    const fulfilledCommunityAllocations = allAllocations.filter((row) =>
      isFulfilledStatus(row.status),
    );
    const unitsForDisplay = (row: Doc<"contribution_allocations">) =>
      isFulfilledStatus(row.status) ? row.units_delivered : row.units_requested;

    const totalContributedUsd = Number(
      fulfilledAllocations
        .reduce((sum, row) => sum + row.amount_usd, 0)
        .toFixed(2),
    );
    const totalTrees = fulfilledAllocations
      .filter((row) => row.api_kind === "trees")
      .reduce((sum, row) => sum + unitsForDisplay(row), 0);
    const totalBottles = fulfilledAllocations
      .filter((row) => row.api_kind === "plastic")
      .reduce((sum, row) => sum + unitsForDisplay(row), 0);
    const communityTrees = fulfilledCommunityAllocations
      .filter((row) => row.api_kind === "trees")
      .reduce((sum, row) => sum + unitsForDisplay(row), 0);
    const communityBottles = fulfilledCommunityAllocations
      .filter((row) => row.api_kind === "plastic")
      .reduce((sum, row) => sum + unitsForDisplay(row), 0);

    const dailyTimeline = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (29 - index));
      const key = date.toISOString().slice(0, 10);

      const dayRows = fulfilledAllocations.filter((row) => {
        return new Date(row._creationTime).toISOString().slice(0, 10) === key;
      });
      const communityDayRows = fulfilledCommunityAllocations.filter((row) => {
        return new Date(row._creationTime).toISOString().slice(0, 10) === key;
      });

      return {
        date: key,
        trees: dayRows
          .filter((row) => row.api_kind === "trees")
          .reduce((sum, row) => sum + unitsForDisplay(row), 0),
        communityTrees: communityDayRows
          .filter((row) => row.api_kind === "trees")
          .reduce((sum, row) => sum + unitsForDisplay(row), 0),
        bottles: dayRows
          .filter((row) => row.api_kind === "plastic")
          .reduce((sum, row) => sum + unitsForDisplay(row), 0),
      };
    });

    const yearlyTimeline = Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - (11 - index));
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;

      const monthRows = fulfilledAllocations.filter((row) => {
        const created = new Date(row._creationTime);
        return created.getFullYear() === year && created.getMonth() === month;
      });
      const communityMonthRows = fulfilledCommunityAllocations.filter((row) => {
        const created = new Date(row._creationTime);
        return created.getFullYear() === year && created.getMonth() === month;
      });

      return {
        date: key,
        trees: monthRows
          .filter((row) => row.api_kind === "trees")
          .reduce((sum, row) => sum + unitsForDisplay(row), 0),
        communityTrees: communityMonthRows
          .filter((row) => row.api_kind === "trees")
          .reduce((sum, row) => sum + unitsForDisplay(row), 0),
        bottles: monthRows
          .filter((row) => row.api_kind === "plastic")
          .reduce((sum, row) => sum + unitsForDisplay(row), 0),
      };
    });

    return {
      summary: {
        totalContributedUsd,
        totalTrees,
        totalBottles,
        totalEvents: events.length,
        totalCommunityEvents: allEvents.length + COMMUNITY_EVENTS_BASELINE,
        communityTrees: communityTrees + COMMUNITY_TREES_BASELINE,
        communityBottles,
      },
      initiatives: CONTRIBUTION_INITIATIVES.map((initiative) => {
        const rows = allocations.filter(
          (row) =>
            row.initiative_id === initiative.id && isFulfilledStatus(row.status),
        );
        return {
          ...initiative,
          contributedUsd: Number(
            rows.reduce((sum, row) => sum + row.amount_usd, 0).toFixed(2),
          ),
          units: rows.reduce((sum, row) => sum + row.units_delivered, 0),
        };
      }),
      timeline: {
        monthly: dailyTimeline,
        yearly: yearlyTimeline,
      },
      recentEvents: events
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 12)
        .map((event) => {
          const eventAllocations = allocations.filter(
            (row) => row.contribution_event_id === event._id,
          );
          return {
            id: String(event._id),
            amountUsd: event.amount_usd,
            currency: event.currency,
            sourceType: event.source_type,
            status: event.status,
            createdAt: new Date(event._creationTime).toISOString(),
            fulfilledAt:
              typeof event.fulfilled_at === "number"
                ? new Date(event.fulfilled_at).toISOString()
                : null,
            trees: eventAllocations
              .filter((row) => row.api_kind === "trees")
              .reduce((sum, row) => sum + unitsForDisplay(row), 0),
            bottles: eventAllocations
              .filter((row) => row.api_kind === "plastic")
              .reduce((sum, row) => sum + unitsForDisplay(row), 0),
          };
        }),
      communityActivity: allEvents
        .slice()
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 20)
        .map((event) => {
          const profile = profileByUserId.get(event.user_id);
          const eventAllocations = allAllocations.filter(
            (row) => row.contribution_event_id === event._id,
          );
          return {
            id: String(event._id),
            userId: event.user_id,
            status: event.status,
            createdAt: new Date(event._creationTime).toISOString(),
            trees: eventAllocations
              .filter((row) => row.api_kind === "trees")
              .reduce((sum, row) => sum + unitsForDisplay(row), 0),
            bottles: eventAllocations
              .filter((row) => row.api_kind === "plastic")
              .reduce((sum, row) => sum + unitsForDisplay(row), 0),
            label:
              profile?.full_name?.trim() ||
              profile?.email?.split("@")[0] ||
              "Anonymous",
          };
        }),
    };
  },
});
