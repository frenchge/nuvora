import Link from "next/link";
import { ArrowRight, Leaf, Search, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "FAQ — Nuvora",
  description:
    "Answers about pricing, credits, models, uploads, and the environmental contribution built into Nuvora.",
};

const FAQS = [
  {
    question: "How is this different from paying for another AI subscription?",
    answer:
      "The core idea is simple: if you're already paying monthly for AI, Nuvora gives you one home for the best models and uses paid activity to fund environmental work through our partners at the same time.",
  },
  {
    question: "Do all paid plans include the same models?",
    answer:
      "Yes. Every paid plan includes the same paid conversational model catalog. You are not upgrading for a different set of models. You are upgrading for more credits, more daily room, and more impact.",
  },
  {
    question: "What does the free plan include?",
    answer:
      "Free gives you a smaller monthly credit balance and access to a lighter set of models, so you can learn the product before deciding whether it fits your workflow.",
  },
  {
    question: "Can I upload documents and images?",
    answer:
      "Yes. File reading, image understanding, and web search are part of the product. Compatible models can work with PDFs, screenshots, photos, and other common inputs directly in chat.",
  },
  {
    question: "What exactly is the environmental contribution?",
    answer:
      "Paid subscriptions fund verified tree planting through our partners. Higher plans plant more each month.",
  },
  {
    question: "Can I buy more credits without changing plans?",
    answer:
      "Yes. You can top up with one-time credit add-ons whenever you need more room for a busy month.",
  },
  {
    question: "Do unused credits roll over forever?",
    answer:
      "Monthly plan credits refresh each cycle. One-time purchased add-ons stay available while your account remains active.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can manage your subscription from billing and make changes when your usage changes.",
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="container py-20 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              FAQ
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Everything people ask before they switch.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
              One AI subscription, one credit system, and a built-in
              environmental contribution. Here&apos;s how it works.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4 text-sm text-foreground/80">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              One place for the best conversational models.
            </div>
            <div className="flex items-start gap-3">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Search, files, and images built into the flow.
            </div>
            <div className="flex items-start gap-3">
              <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Paid usage helps fund verified work through our partners.
            </div>
            <div className="flex items-start gap-3">
              <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Higher tiers grow both monthly room and monthly impact.
            </div>
          </div>

          <div className="divide-y divide-border/60 border-y border-border/60">
            {FAQS.map((item) => (
              <div key={item.question} className="py-6">
                <h2 className="text-lg font-semibold tracking-tight">
                  {item.question}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container pb-24 pt-4">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Ready to try it?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Start free, then upgrade when you want more credits and more
              monthly environmental contribution.
            </p>
          </div>
          <div className="flex gap-3">
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
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
