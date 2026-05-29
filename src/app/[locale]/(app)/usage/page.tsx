import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { PLAN_DISPLAY } from "@/lib/plans";
import { fetchQuery, getRequiredConvexToken } from "@/lib/convex-server";
import { formatCredits } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UsagePage() {
  const token = await getRequiredConvexToken();
  const [profile, overview] = await Promise.all([
    fetchQuery(api.users.me, {}, { token }),
    fetchQuery(api.credits.getUsageOverview, {}, { token }),
  ]);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const usedThisMonth = overview.usedThisMonth;
  const monthlyAlloc = overview.monthlyCredits ?? 100;
  const monthlyPct = Math.min(100, Math.round((usedThisMonth / Math.max(1, monthlyAlloc)) * 100));
  const dailyLimit = overview.dailyMessageLimit ?? 20;
  const dailyPct = Math.min(100, Math.round((overview.messagesToday / dailyLimit) * 100));

  const plan = PLAN_DISPLAY[profile.plan_name as keyof typeof PLAN_DISPLAY];

  return (
    <div className="container max-w-none py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usage & credits</h1>
          <p className="text-sm text-muted-foreground">
            Current plan: <span className="font-medium">{plan.label}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/billing">Manage billing</Link></Button>
          <Button asChild><Link href="/pricing">Upgrade</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Credit balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatCredits(overview.balance)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Plan refills {formatCredits(monthlyAlloc)} / month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Used this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatCredits(usedThisMonth)}</div>
            <Progress value={monthlyPct} className="mt-3" />
            <div className="text-xs text-muted-foreground mt-1">{monthlyPct}% of monthly allocation</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Messages today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{overview.messagesToday}<span className="text-sm text-muted-foreground"> / {dailyLimit}</span></div>
            <Progress value={dailyPct} className="mt-3" />
            <div className="text-xs text-muted-foreground mt-1">Resets at 00:00 UTC</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent credit activity</CardTitle></CardHeader>
        <CardContent>
          {overview.ledger.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="divide-y">
              {overview.ledger.map((row) => (
                <div key={row.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{row.description ?? row.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={row.amount >= 0 ? "secondary" : "outline"}>
                      {row.amount >= 0 ? "+" : ""}{formatCredits(row.amount)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
