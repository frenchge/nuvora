import Link from "next/link";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { CREDIT_ADDONS, PLAN_DISPLAY, PLAN_ORDER } from "@/lib/plans";
import { formatCredits, formatEur } from "@/lib/utils";

export const metadata = { title: "Pricing — Vercilio" };

const DAILY_MESSAGES: Record<(typeof PLAN_ORDER)[number], string> = {
  free: "20 / day",
  basic: "150 / day",
  starter: "350 / day",
  pro: "700 / day",
};

const BEST_FOR: Record<(typeof PLAN_ORDER)[number], string> = {
  free: "Trying the product",
  basic: "Daily solo work",
  starter: "Heavy weekly use",
  pro: "Power users and teams",
};

const COMPARISON_ROWS = [
  {
    label: "Monthly price",
    values: PLAN_ORDER.map((plan) =>
      plan === "free"
        ? "Free"
        : `${formatEur(PLAN_DISPLAY[plan].price, { precision: 0 })}/mo`,
    ),
  },
  {
    label: "Credits each month",
    values: PLAN_ORDER.map((plan) => formatCredits(PLAN_DISPLAY[plan].credits)),
  },
  {
    label: "Model access",
    values: PLAN_ORDER.map((plan) =>
      plan === "free"
        ? "Fast smaller models"
        : "All paid conversational models",
    ),
  },
  {
    label: "Files, images, and web search",
    values: PLAN_ORDER.map((plan) =>
      plan === "free" ? "Included with free limits" : "Included",
    ),
  },
  {
    label: "Daily usage",
    values: PLAN_ORDER.map((plan) => DAILY_MESSAGES[plan]),
  },
  {
    label: "Environmental contribution",
    values: PLAN_ORDER.map((plan) => {
      const current = PLAN_DISPLAY[plan];
      if (plan === "free") return "Not included";
      return `${current.trees} trees`;
    }),
  },
  {
    label: "Best for",
    values: PLAN_ORDER.map((plan) => BEST_FOR[plan]),
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Pricing
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Pay for AI. Help the planet at the same time.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
              If you&apos;re already spending money on AI each month, this is
              the better trade: one calm workspace for the best models, plus
              verified trees planted through our partners.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Compare plans
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Every paid plan unlocks the full paid model catalog. The real
                difference is how much AI room you get each month, and how much
                environmental work your subscription helps fund.
              </p>
            </div>
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                One workspace for GPT, Claude, Gemini, DeepSeek, Mistral, and more.
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Paid plans include verified environmental contribution every month.
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Higher plans do more, so upgrading grows both your AI capacity and your impact.
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[860px] border-y border-border/60">
              <div className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))] border-b border-border/60">
                <div className="py-5" />
                {PLAN_ORDER.map((plan) => {
                  const current = PLAN_DISPLAY[plan];
                  return (
                    <div
                      key={plan}
                      className="border-l border-border/60 px-5 py-5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-base font-semibold">{current.label}</div>
                        {current.highlighted && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {BEST_FOR[plan]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))] border-b border-border/50"
                >
                  <div className="px-5 py-4 text-sm font-medium text-foreground/80">
                    {row.label}
                  </div>
                  {row.values.map((value, index) => (
                    <div
                      key={`${row.label}-${PLAN_ORDER[index]}`}
                      className="border-l border-border/50 px-5 py-4 text-sm text-foreground/75"
                    >
                      {value}
                    </div>
                  ))}
                </div>
              ))}

              <div className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))]">
                <div className="px-5 py-5 text-sm font-medium text-foreground/80">
                  Get started
                </div>
                {PLAN_ORDER.map((plan) => {
                  const current = PLAN_DISPLAY[plan];
                  return (
                    <div
                      key={`cta-${plan}`}
                      className="border-l border-border/50 px-5 py-5"
                    >
                      {plan === "free" ? (
                        <Button className="w-full" variant="outline" asChild>
                          <Link href="/sign-up">Start free</Link>
                        </Button>
                      ) : (
                        <Button className="w-full" asChild>
                          <Link href={`/billing?upgrade=${plan}`}>
                            Choose {current.label}
                          </Link>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="border-y border-border/60">
          <div className="grid gap-4 py-6 md:grid-cols-[1.1fr_repeat(4,minmax(0,1fr))] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Credit add-ons
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Need more room this month? Top up without changing your plan.
              </p>
            </div>
            {CREDIT_ADDONS.map((addon) => (
              <div key={addon.key} className="border-l border-border/50 px-4 py-2">
                <div className="text-lg font-semibold">
                  {formatCredits(addon.credits)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatEur(addon.price)}
                </div>
                <Button className="mt-4 w-full" variant="outline" asChild>
                  <Link href={`/billing?addon=${addon.key}`}>Buy add-on</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-24 pt-12">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">
              Questions before you switch?
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Read the FAQ for how credits work, what impact is included, and
              how plans change when you upgrade.
            </p>
          </div>
          <Button size="lg" variant="outline" asChild>
            <Link href="/faq">
              Open FAQ
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
