import Link from "next/link";
import {
  Compass,
  Heart,
  Leaf,
  ShieldCheck,
  Sparkles,
  Trees,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About — Vercilio",
  description:
    "Why we built Vercilio: a calm home for every AI model, with real-world environmental impact baked in.",
};

const PRINCIPLES = [
  {
    icon: Compass,
    title: "Clarity over hype",
    body: "No usage-shaming, no surprise bills, no fake urgency. We tell you exactly what each message costs and where every dollar goes.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy as a default",
    body: "Your conversations are stored against your account and never used to train models. The simplest privacy policy is one you don't need to read.",
  },
  {
    icon: Heart,
    title: "Quietly opinionated",
    body: "We make small choices for you — sensible model defaults, gentle limits, calm typography — so you can think instead of fiddle.",
  },
  {
    icon: Leaf,
    title: "A small piece of every payment, returned",
    body: "We keep a fixed margin on every plan and route the rest into restoration partners. Same plan, more good.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-32 h-[440px] bg-[radial-gradient(60%_50%_at_50%_30%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="container relative pt-24 pb-16 text-center md:pt-32">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Trees className="h-3 w-3 text-primary" />
            Why we built this
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            AI tools shouldn&apos;t feel{" "}
            <span className="text-primary">extractive.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
            We started Vercilio because we kept paying for AI tools that felt
            loud, lonely, and hungry for our data — and gave nothing back to
            the world the conversations were about.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-base leading-8 text-foreground/80">
          <p>
            Most subscription apps treat you like a meter. The dashboards
            scream, the upgrade prompts pulse, and the moment you forget to
            cancel, the bill arrives twice. We wanted something that felt the
            opposite — a tool you could leave open in a tab and never resent.
          </p>
          <p>
            So Vercilio is built around a small set of beliefs: that frontier
            models should live next to fast, cheap ones in the same window;
            that monthly credits beat token math; that a calm interface is
            worth more than a clever one; and that the planet doing the
            heating of these GPUs deserves a kickback every month.
          </p>
          <p>
            What you pay for is the access and the calm. What we keep is a
            modest margin on each plan. The remainder goes to mangrove
            restoration in Brazil and Kenya and native-tree planting across
            North America through long-term partner programs. You see the
            receipts in your settings.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-secondary/40 border-y border-border/60">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              How we make choices
            </h2>
            <p className="mt-3 text-muted-foreground">
              Four principles we reach for when there&apos;s a tradeoff.
            </p>
          </div>
          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-accent/70 border-y border-border/60">
        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              A simpler deal
            </h2>
            <p className="mt-3 text-foreground/75">
              Pay for great AI, get a calmer product, and let the same monthly
              subscription help fund real tree planting through trusted partners.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-background px-8 py-16 text-center md:px-16 md:py-20">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <h3 className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Try it for an afternoon.
          </h3>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            100 free credits a month — no card, no commitment.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/sign-up">Start free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
