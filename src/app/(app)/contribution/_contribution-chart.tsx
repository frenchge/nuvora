"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type TimelinePoint = {
  date: string;
  trees: number;
  communityTrees: number;
};

type RangeKey = "monthly" | "yearly";
type ScopeKey = "community" | "you";

const chartConfig = {
  trees: {
    label: "Trees planted",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ContributionChart({
  timeline,
  totalTrees,
  communityTrees,
  bare = false,
}: {
  timeline: Record<RangeKey, TimelinePoint[]>;
  totalTrees: number;
  communityTrees?: number;
  bare?: boolean;
}) {
  const [range, setRange] = useState<RangeKey>("monthly");
  const [scope, setScope] = useState<ScopeKey>("community");

  const activeData = useMemo(
    () =>
      timeline[range].map((point) => ({
        date: point.date,
        yourTrees: point.trees,
        communityTrees: point.communityTrees,
        value: scope === "community" ? point.communityTrees : point.trees,
      })),
    [range, scope, timeline],
  );

  return (
    <div
      className={cn(
        bare
          ? "overflow-visible"
          : "overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 shadow-sm",
      )}
    >
      <div
        className={cn(
          "grid lg:grid-cols-[minmax(0,1.4fr)_280px]",
          bare ? "" : "border-b border-border/60",
        )}
      >
        <div className="px-6 py-6 lg:px-8">
          {bare ? (
            <h2 className="text-2xl font-semibold tracking-tight">
              Contribution
            </h2>
          ) : (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">
                Community
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                See how many trees this community has already helped put in the
                ground, then compare it with your own share.
              </p>
            </>
          )}
          {bare && (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Track the trees planted through your plan.
            </p>
          )}
        </div>

        <MetricButton
          label="Trees planted"
          value={bare ? totalTrees : scope === "community" ? (communityTrees ?? totalTrees) : totalTrees}
          bare={bare}
        />
      </div>

      <div className="px-4 pb-4 pt-6 sm:px-6 sm:pb-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          {!bare ? (
            <div className="flex items-center gap-2">
              {(
                [
                  ["community", "Community"],
                  ["you", "You"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScope(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    scope === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-background/35 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {(
              [
                ["monthly", "Monthly"],
                ["yearly", "Yearly"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  range === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-background/35 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ChartContainer
          config={chartConfig}
          className="h-[360px] min-h-[360px] w-full"
        >
          <BarChart accessibilityLayer data={activeData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={28}
              tickFormatter={(value) =>
                range === "monthly"
                  ? new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : new Date(`${value}-01`).toLocaleDateString("en-US", {
                      month: "short",
                      year: "2-digit",
                    })
              }
            />
            <ChartTooltip
              cursor={false}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as
                  | {
                      communityTrees: number;
                      yourTrees: number;
                    }
                  | undefined;
                if (!row) return null;
                const title =
                  range === "monthly"
                    ? new Date(String(label)).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })
                    : new Date(`${String(label)}-01`).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      );
                return (
                  <div className="min-w-[190px] rounded-2xl border border-border/70 bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {title}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {row.communityTrees.toLocaleString()} trees planted
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      You: {row.yourTrees.toLocaleString()}
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 0, 0, 0]}
              maxBarSize={34}
              fill="var(--color-trees)"
            >
              {activeData.map((point, index) => (
                <Cell
                  key={`${point.date}-${index}`}
                  fill="var(--color-trees)"
                  fillOpacity={0.92}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

function MetricButton({
  label,
  value,
  bare,
}: {
  label: string;
  value: number;
  bare?: boolean;
}) {
  return (
    <div
      className={cn(
        bare
          ? "flex flex-col items-end justify-center gap-1 px-6 py-6 text-right lg:px-8"
          : "flex min-h-[132px] flex-col justify-center border-t border-border/60 bg-primary px-6 py-5 text-left text-primary-foreground shadow-sm ring-1 ring-primary/20 lg:border-l lg:border-t-0 lg:px-8",
      )}
    >
      <span
        className={cn(
          "text-sm",
          bare ? "text-muted-foreground" : "text-primary-foreground/80",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-semibold leading-none tracking-tight",
          bare ? "text-3xl text-foreground" : "mt-2 text-5xl",
        )}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}
