"use client";

import { useMemo, useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { CheckCircle2, Leaf, Loader2 } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCredits } from "@/lib/utils";
import type { PlanName } from "@/lib/types";

type AdminUserRow = {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  planName: string;
  isAdmin: boolean;
  discountPercent: number;
  discountNote: string;
  creditsBalance: number;
  subscriptionStatus: string | null;
  trees: number;
  pendingCount: number;
  fulfilledCount: number;
  createdAt: string;
};

type AdminContributionRow = {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  planName: string;
  status: string;
  trees: number;
  sourceType: string;
  createdAt: string;
  fulfilledAt: string | null;
  note: string;
};

type AdminPlan = {
  name: PlanName;
  label: string;
  credits: number;
};

export function AdminDashboard({
  initialUsers,
  initialContributions,
  plans,
}: {
  initialUsers: AdminUserRow[];
  initialContributions: AdminContributionRow[];
  plans: AdminPlan[];
}) {
  const setUserPlan = useMutation(api.admin.setUserPlan);
  const setUserDiscount = useMutation(api.admin.setUserDiscount);
  const setUserAdminRole = useMutation(api.admin.setUserAdminRole);
  const markContributionFulfilled = useMutation(api.admin.markContributionFulfilled);

  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState(initialUsers);
  const [contributions, setContributions] = useState(initialContributions);
  const [draftDiscounts, setDraftDiscounts] = useState<Record<string, string>>(
    Object.fromEntries(
      initialUsers.map((user) => [user.userId, String(user.discountPercent)]),
    ),
  );
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>(
    Object.fromEntries(initialUsers.map((user) => [user.userId, user.discountNote])),
  );
  const [draftContributionNotes, setDraftContributionNotes] = useState<
    Record<string, string>
  >({});

  const pendingContributions = useMemo(
    () => contributions.filter((contribution) => contribution.status === "pending"),
    [contributions],
  );

  const fulfilledContributions = useMemo(
    () => contributions.filter((contribution) => contribution.status !== "pending"),
    [contributions],
  );

  function applyPlan(userId: string, planName: PlanName) {
    startTransition(async () => {
      const result = await setUserPlan({ userId, planName });
      setUsers((current) =>
        current.map((user) =>
          user.userId === userId
            ? {
                ...user,
                planName,
                creditsBalance: result.creditsBalance,
                subscriptionStatus: planName === "free" ? "canceled" : "active",
              }
            : user,
        ),
      );
    });
  }

  function applyDiscount(userId: string) {
    startTransition(async () => {
      const discountPercent = Number(draftDiscounts[userId] ?? "0");
      const note = draftNotes[userId]?.trim() || undefined;
      await setUserDiscount({ userId, discountPercent, note });
      setUsers((current) =>
        current.map((user) =>
          user.userId === userId
            ? {
                ...user,
                discountPercent,
                discountNote: note ?? "",
              }
            : user,
        ),
      );
    });
  }

  function toggleAdmin(userId: string, nextIsAdmin: boolean) {
    startTransition(async () => {
      await setUserAdminRole({ userId, isAdmin: nextIsAdmin });
      setUsers((current) =>
        current.map((user) =>
          user.userId === userId ? { ...user, isAdmin: nextIsAdmin } : user,
        ),
      );
    });
  }

  function fulfill(contributionId: string) {
    startTransition(async () => {
      const note = draftContributionNotes[contributionId]?.trim() || undefined;
      await markContributionFulfilled({
        contributionId: contributionId as never,
        note,
      });
      setContributions((current) =>
        current.map((contribution) =>
          contribution.id === contributionId
            ? {
                ...contribution,
                status: "fulfilled",
                fulfilledAt: new Date().toISOString(),
                note: note ?? contribution.note,
              }
            : contribution,
        ),
      );
    });
  }

  return (
    <div className="space-y-10 py-8">
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Pending contribution queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every paid subscription or add-on appears here first. Mark it
              fulfilled once you’ve handled the planting.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {pendingContributions.length} pending
          </Badge>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60">
          <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1fr] gap-4 border-b border-border/60 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <div>User</div>
            <div>Plan</div>
            <div>Impact</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {pendingContributions.length === 0 ? (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              Nothing is waiting on you right now.
            </div>
          ) : (
            pendingContributions.map((contribution) => (
              <div
                key={contribution.id}
                className="grid grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_1fr] gap-4 border-b border-border/40 px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {contribution.fullName || contribution.email || contribution.userId}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {contribution.email || contribution.userId}
                  </div>
                </div>
                <div className="text-sm">{capitalize(contribution.planName)}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
                    {contribution.trees} trees
                  </div>
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  Pending
                </div>
                <div className="space-y-2">
                  <Input
                    value={draftContributionNotes[contribution.id] ?? contribution.note}
                    onChange={(event) =>
                      setDraftContributionNotes((current) => ({
                        ...current,
                        [contribution.id]: event.target.value,
                      }))
                    }
                    placeholder="Optional note"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fulfill(contribution.id)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Mark fulfilled
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update plans, set admin discounts, and keep an eye on the impact
            attached to each account.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60">
          <div className="grid grid-cols-[1.4fr_0.95fr_1fr_1fr_1.2fr] gap-4 border-b border-border/60 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <div>User</div>
            <div>Plan</div>
            <div>Credits</div>
            <div>Impact</div>
            <div>Discount</div>
          </div>

          {users.map((user) => (
            <div
              key={user.userId}
              className="grid grid-cols-[1.4fr_0.95fr_1fr_1fr_1.2fr] gap-4 border-b border-border/40 px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {user.fullName || user.email || user.userId}
                  </span>
                  {user.isAdmin && (
                    <Badge variant="secondary" className="rounded-full">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  {user.email || user.userId}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {user.subscriptionStatus
                    ? `Subscription ${user.subscriptionStatus}`
                    : "No active subscription"}
                </div>
                <button
                  type="button"
                  onClick={() => toggleAdmin(user.userId, !user.isAdmin)}
                  className="mt-2 text-xs font-medium text-primary transition hover:opacity-75"
                >
                  {user.isAdmin ? "Remove admin access" : "Make admin"}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => applyPlan(user.userId, plan.name)}
                      disabled={isPending}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition",
                        user.planName === plan.name
                          ? "border-foreground/15 bg-secondary text-foreground"
                          : "border-border/70 text-muted-foreground hover:border-foreground/15 hover:bg-secondary/50 hover:text-foreground",
                      )}
                    >
                      {plan.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm">
                <div className="font-medium">
                  {formatCredits(user.creditsBalance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  current balance
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div>{user.trees} trees</div>
                <div className="text-xs text-muted-foreground">
                  {user.pendingCount} pending / {user.fulfilledCount} fulfilled
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={draftDiscounts[user.userId] ?? "0"}
                    onChange={(event) =>
                      setDraftDiscounts((current) => ({
                        ...current,
                        [user.userId]: event.target.value,
                      }))
                    }
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyDiscount(user.userId)}
                    disabled={isPending}
                  >
                    Save
                  </Button>
                </div>
                <Input
                  value={draftNotes[user.userId] ?? ""}
                  onChange={(event) =>
                    setDraftNotes((current) => ({
                      ...current,
                      [user.userId]: event.target.value,
                    }))
                  }
                  placeholder="Reason or note"
                  className="h-9"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Recently fulfilled</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick history of the work you’ve already confirmed.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60">
          {fulfilledContributions.length === 0 ? (
            <div className="px-5 py-8 text-sm text-muted-foreground">
              Nothing has been fulfilled yet.
            </div>
          ) : (
            fulfilledContributions.map((contribution) => (
              <div
                key={contribution.id}
                className="flex items-center justify-between gap-4 border-b border-border/40 px-5 py-4 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {contribution.fullName || contribution.email || contribution.userId}
                  </div>
                <div className="truncate text-muted-foreground">
                    {contribution.trees} trees
                </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>
                    {contribution.fulfilledAt
                      ? new Date(contribution.fulfilledAt).toLocaleString()
                      : "Fulfilled"}
                  </div>
                  {contribution.note && <div>{contribution.note}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
