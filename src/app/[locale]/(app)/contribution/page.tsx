import { ArrowUpRight, Leaf } from "lucide-react";
import { api } from "@convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { fetchQuery, getRequiredConvexToken } from "@/lib/convex-server";
import { ContributionChart } from "./_contribution-chart";

export const dynamic = "force-dynamic";

type ContributionEvent = {
  id: string;
  sourceType: string;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
  trees: number;
};

export default async function ContributionPage() {
  const token = await getRequiredConvexToken();
  const [profile, dashboard] = await Promise.all([
    fetchQuery(api.users.me, {}, { token }),
    fetchQuery(api.contributions.getContributionDashboard, {}, { token }),
  ]);

  if (!profile) {
    throw new Error("Profile not found");
  }

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="px-8 pb-8 pt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Community</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Watch the shared forest grow as fulfilled plan contributions turn
              into real trees over time.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {profile.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-foreground transition hover:bg-secondary/60"
              >
                Admin
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 border-b border-border/50 pb-8 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4" />
              Trees planted
            </div>
            <div className="text-4xl font-semibold tracking-tight">
              {dashboard.summary.communityTrees.toLocaleString()}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Activity</div>
            <div className="text-4xl font-semibold tracking-tight">
              {dashboard.summary.totalCommunityEvents.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ContributionChart
            timeline={dashboard.timeline}
            totalTrees={dashboard.summary.communityTrees}
            communityTrees={dashboard.summary.communityTrees}
            bare
          />
        </div>

        <div className="mt-6 border-t border-border/50 pt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <p className="text-sm text-muted-foreground">
              The latest fulfilled and queued tree contributions across the
              platform.
            </p>
          </div>
          <div className="space-y-3">
            {dashboard.recentEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-muted-foreground">
                No community activity yet. Once a paid charge succeeds, it will
                appear here automatically.
              </div>
            ) : (
              (dashboard.recentEvents as ContributionEvent[]).map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {event.sourceType} contribution
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.trees} trees
                    </div>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <div>
                      {event.status === "fulfilled" ? "Planted" : "Queued"}
                    </div>
                    {event.fulfilledAt && (
                      <div className="mt-1 normal-case tracking-normal">
                        {new Date(event.fulfilledAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
