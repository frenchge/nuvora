import Link from "next/link";
import {
  ArrowRight,
  Check,
  Leaf,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ProviderLogoMarquee } from "@/components/marketing/app-mockup";
import { ImpactMap } from "@/components/marketing/impact-map";
import { Button } from "@/components/ui/button";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";
import { PLAN_DISPLAY, PLAN_ORDER } from "@/lib/plans";
import { formatCredits, formatEur } from "@/lib/utils";

const VALUES = [
  {
    icon: Sparkles,
    title: "Use the best AI in one place.",
    body: "Move between frontier and fast models without breaking your flow or juggling subscriptions.",
  },
  {
    icon: Leaf,
    title: "Every prompt can do some good.",
    body: "Paid usage helps fund real tree planting through vetted environmental partners.",
  },
  {
    icon: ShieldCheck,
    title: "Your work stays yours.",
    body: "Conversations stay tied to your account. We do not train on your private work.",
  },
  {
    icon: Zap,
    title: "A calmer way to pay for AI.",
    body: "One clear subscription, predictable monthly credits, and a product that doesn’t try to shout at you.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero ----------------------------------------------------------- */}
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1"
        posterSrc="https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg"
        bgImageSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS"
        title="AI that does more with every subscription."
        date="Nuvora"
        scrollToExpand="Scroll to explore"
        textBlend
      >
        <div className="flex flex-col items-center text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Leaf className="h-3 w-3 text-primary" />
            One AI subscription. Built-in environmental impact.
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            The best AI models,
            <span className="text-primary"> with real impact built in.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
            Use GPT, Claude, Gemini, DeepSeek, Mistral, and more in one calm
            workspace that turns paid usage into verified trees planted.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            100 free credits a month · No card required
          </p>
        </div>
      </ScrollExpandMedia>

      {/* Provider strip -------------------------------------------------- */}
      <section id="models" className="border-y border-border/50 bg-[hsl(var(--accent))]">
        <div className="container py-10">
          <p className="text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Routed across the world's leading models
          </p>
          <ProviderLogoMarquee className="mt-6" />
        </div>
      </section>

      {/* Values ---------------------------------------------------------- */}
      <section id="how" className="bg-background">
        <div className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            More from every AI subscription.
          </h2>
          <p className="mt-4 text-muted-foreground">
            If you already pay for AI, your monthly bill can do more than just unlock messages.
          </p>
        </div>

        <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Impact ---------------------------------------------------------- */}
      <section id="impact" className="border-y border-border/60 bg-[hsl(var(--secondary))]">
        <div className="container grid gap-12 py-24 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Leaf className="h-3 w-3" />
              Real impact
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              Use AI daily. Help the planet quietly.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Our environmental partners currently report more than 3.9
              million trees planted, 150+ species represented, 85%+ average
              tree maturity, and 15+ year partner commitments. Paid activity
              inside Nuvora helps fund the same kind of verified, trackable
              work.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Verified tree planting from $0.43 per tree",
                "Per-payment contribution history inside your account",
                "Long-term planting partners with species diversity and survival tracking",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/80">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <ImpactLine
              icon={Leaf}
              value="3.9M+"
              label="trees planted through our partners"
            />
            <ImpactLine
              icon={Sparkles}
              value="150+"
              label="tree species represented across partner projects"
            />
            <ImpactLine
              icon={ShieldCheck}
              value="85%+"
              label="average tree maturity reported by partners"
            />
            <ImpactLine
              icon={Sparkles}
              value="15+ years"
              label="partner stewardship commitments"
            />
          </div>
        </div>
        <div className="container pb-24">
          <ImpactMap />
        </div>
      </section>

      {/* Plans teaser ---------------------------------------------------- */}
      <section className="bg-background">
        <div className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            One plan. Every model. More impact as you grow.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free, then scale your AI usage and your environmental contribution together.
          </p>
        </div>
        <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
          {PLAN_ORDER.map((p) => {
            const plan = PLAN_DISPLAY[p];
            return (
              <div
                key={plan.name}
                className="grid gap-4 py-6 md:grid-cols-[1.2fr_1fr_1fr_minmax(260px,auto)] md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold capitalize">
                      {plan.label}
                    </div>
                    {plan.highlighted && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {plan.name === "free"
                      ? "A lighter starting point for occasional use."
                      : "All paid AI models included on every paid plan."}
                  </div>
                </div>
                <div className="text-3xl font-semibold tracking-tight">
                  {formatEur(plan.price, { precision: 0 })}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>{formatCredits(plan.credits)} credits / month</div>
                  <div>{plan.trees} trees planted each month</div>
                </div>
                <div className="text-right">
                  {plan.trees > 0 ? (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary">
                      <Leaf className="h-3 w-3" />
                      Environmental contribution included
                    </div>
                  ) : (
                    <span aria-hidden className="invisible text-[11px]">
                      placeholder
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">See full pricing</Link>
          </Button>
        </div>
        </div>
      </section>

      {/* CTA ------------------------------------------------------------- */}
      <section className="bg-[hsl(var(--accent))]">
        <div className="container pb-24 pt-24">
        <div className="text-center">
          <h3 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            The AI subscription that gives something back.
          </h3>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Try Nuvora for free, then upgrade when you want more credits and a
            bigger monthly contribution to tree planting.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        </div>
      </section>

      <section id="faq" className="bg-background">
        <div className="container pb-24 pt-24">
        <div className="mx-auto max-w-3xl border-t border-border/60 pt-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Questions people usually ask.
            </h2>
            <p className="mt-3 text-muted-foreground">
              The short version: it works like the AI subscription you already
              know, except your paid usage also helps fund real environmental work.
            </p>
          </div>

          <div className="mt-10 divide-y divide-border/60 border-y border-border/60">
            {[
              {
                question: "Do I lose access to the big models on cheaper paid plans?",
                answer:
                  "No. Every paid plan includes the same paid conversational model catalog. The differences are credits, daily room, and environmental contribution.",
              },
              {
                question: "What happens on the free plan?",
                answer:
                  "You get a smaller monthly credit pool and access to a lighter free-model mix, so you can try the product before committing.",
              },
              {
                question: "What exactly does my subscription fund?",
                answer:
                  "Every paid plan helps fund tree planting through our restoration partners. Higher tiers simply plant more each month.",
                },
              {
                question: "Can I upload files, images, and search the web?",
                answer:
                  "Yes. Nuvora is built around conversational work, so search, file reading, and image understanding are part of the core experience.",
              },
            ].map((item) => (
              <div key={item.question} className="py-6">
                <h3 className="text-lg font-semibold tracking-tight">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link href="/faq">Read the full FAQ</Link>
            </Button>
          </div>
        </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function ImpactLine({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Leaf;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border/50 pb-6">
      <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
        <div className="mt-1 text-sm text-foreground/70">{label}</div>
      </div>
    </div>
  );
}
