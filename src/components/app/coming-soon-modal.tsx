"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Sparkles, X } from "lucide-react";

export type ComingSoonFeature = "integrations" | "canva" | "code";

const META: Record<
  ComingSoonFeature,
  {
    title: string;
    eyebrow: string;
    description: string;
  }
> = {
  integrations: {
    eyebrow: "Coming soon",
    title: "Plug in the apps you already use.",
    description:
      "Trigger flows in your favourite tools straight from a chat — without leaving the conversation.",
  },
  canva: {
    eyebrow: "Coming soon",
    title: "Generate brand-ready images, inline.",
    description:
      "Describe what you want, pick a vibe, and get four variations you can drop straight into your work.",
  },
  code: {
    eyebrow: "Coming soon",
    title: "Generate full apps, live in your chat.",
    description:
      "Tell Vercilio what to build. Watch components stream in next to working code, ready to ship.",
  },
};

export function ComingSoonModal({
  feature,
  open,
  onOpenChange,
}: {
  feature: ComingSoonFeature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!feature) return null;
  const meta = META[feature];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-[0_30px_120px_-20px_rgba(0,0,0,0.45)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          {/* Hero */}
          <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/15 via-primary/[0.04] to-background px-8 pt-9 pb-7">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
            <div className="relative">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
                {meta.eyebrow}
              </span>
              <Dialog.Title className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-[2rem]">
                {meta.title}
              </Dialog.Title>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                {meta.description}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card/50 px-6 py-7 sm:px-8">
            {feature === "integrations" && <IntegrationsPreview />}
            {feature === "canva" && <CanvaPreview />}
            {feature === "code" && <CodePreview />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border/60 px-6 py-4 sm:px-8">
            <p className="mr-auto text-xs text-muted-foreground">
              We&apos;ll let you know the second it&apos;s ready.
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              Sounds good
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Integrations: horizontal marquee with real brand logos ─────────────────

const INTEGRATIONS: Array<{ name: string; slug: string }> = [
  { name: "Gmail", slug: "gmail" },
  { name: "Slack", slug: "slack" },
  { name: "Notion", slug: "notion" },
  { name: "Airtable", slug: "airtable" },
  { name: "Zapier", slug: "zapier" },
  { name: "Linear", slug: "linear" },
  { name: "GitHub", slug: "github" },
  { name: "Stripe", slug: "stripe" },
  { name: "HubSpot", slug: "hubspot" },
  { name: "Google Drive", slug: "googledrive" },
  { name: "Google Calendar", slug: "googlecalendar" },
  { name: "Dropbox", slug: "dropbox" },
  { name: "Figma", slug: "figma" },
  { name: "Intercom", slug: "intercom" },
  { name: "Mailchimp", slug: "mailchimp" },
  { name: "Jira", slug: "jira" },
  { name: "Trello", slug: "trello" },
  { name: "Asana", slug: "asana" },
];

function IntegrationsPreview() {
  // Two rows, opposite directions, slightly different speeds for parallax.
  const rowA = INTEGRATIONS.slice(0, 9);
  const rowB = INTEGRATIONS.slice(9);

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
        20+ integrations on day one
      </p>
      <div className="space-y-3">
        <LogoMarquee logos={rowA} duration={32} direction="left" />
        <LogoMarquee logos={rowB} duration={38} direction="right" />
      </div>
      <p className="text-xs text-muted-foreground">
        Connect once and trigger flows from any chat — send an email, create a
        ticket, post to a channel.
      </p>
    </div>
  );
}

function LogoMarquee({
  logos,
  duration,
  direction,
}: {
  logos: Array<{ name: string; slug: string }>;
  duration: number;
  direction: "left" | "right";
}) {
  // Duplicate the list so the loop appears seamless.
  const sequence = [...logos, ...logos];
  return (
    <div className="group relative overflow-hidden py-3">
      {/* Edge fades blend the loop into the surrounding card cleanly */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16 bg-gradient-to-r from-card via-card/85 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-16 bg-gradient-to-l from-card via-card/85 to-transparent" />
      <div
        className="flex w-max items-center gap-8 group-hover:[animation-play-state:paused]"
        style={{
          animationName: "logo-marquee",
          animationDuration: `${duration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDirection: direction === "left" ? "normal" : "reverse",
        }}
      >
        {sequence.map((logo, i) => (
          <LogoChip key={`${logo.slug}-${i}`} {...logo} />
        ))}
      </div>
      <style>{`
        @keyframes logo-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function LogoChip({ name, slug }: { name: string; slug: string }) {
  // Two URLs from Simple Icons CDN — one tinted for light mode, one white for
  // dark mode. We swap them via Tailwind's dark variant so the logos always
  // sit cleanly on whichever background is active.
  // eager loading is required here: lazy loading skips images inside
  // overflow:hidden marquee containers that the browser thinks are off-screen.
  const hide = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };
  return (
    <div className="flex shrink-0 items-center gap-2 px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.simpleicons.org/${slug}/4b5563`}
        alt={`${name} logo`}
        loading="eager"
        decoding="async"
        className="h-5 w-5 dark:hidden"
        onError={hide}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.simpleicons.org/${slug}/ffffff`}
        alt=""
        aria-hidden
        loading="eager"
        decoding="async"
        className="hidden h-5 w-5 dark:block"
        onError={hide}
      />
      <span className="whitespace-nowrap text-sm font-medium text-foreground/85">
        {name}
      </span>
    </div>
  );
}

// ── Canva: real Unsplash photos with a generation flourish ────────────────

const CANVA_IMAGES: Array<{ url: string; alt: string }> = [
  {
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&auto=format&fit=crop",
    alt: "Sunlit pine forest from below",
  },
  {
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80&auto=format&fit=crop",
    alt: "Waterfall in a misty forest",
  },
  {
    url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80&auto=format&fit=crop",
    alt: "Mountain range at sunrise",
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80&auto=format&fit=crop",
    alt: "Misty conifer forest at dawn",
  },
];

function CanvaPreview() {
  // Re-trigger the "generation" reveal each time the modal opens.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((t) => t + 1);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-4 py-2.5 text-sm shadow-sm">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-foreground/80">
          A serene minimalist forest at golden hour
        </span>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Generating
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CANVA_IMAGES.map((img, i) => (
          <div
            key={`${img.url}-${tick}`}
            className="relative aspect-square overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              style={{
                opacity: 0,
                transform: "scale(1.04)",
                animation: `canva-reveal 800ms ease-out ${i * 220}ms forwards`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 -translate-x-full"
              style={{
                background:
                  "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                animation: `canva-shimmer 1.6s ease-out ${i * 220}ms 1`,
              }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Four variations every time. Pick one or remix the prompt — no leaving
        the chat, no extra subscription.
      </p>
      <style>{`
        @keyframes canva-reveal {
          0% { opacity: 0; transform: scale(1.06); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes canva-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}

// ── Code: v0.dev-style chrome with tabs + framed preview ──────────────────

function CodePreview() {
  const [tab, setTab] = useState<"preview" | "code">("preview");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      {/* Top bar — file path on the left, Preview / Code tabs on the right. */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>
        <div className="font-mono text-[11px] text-muted-foreground/80">
          HeroBanner.tsx
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-background p-0.5 shadow-inner ring-1 ring-border/60">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors " +
                (tab === t
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stage area */}
      <div className="relative">
        <div className="grid bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.06),transparent_60%)]">
          <div
            className="col-start-1 row-start-1 transition-opacity duration-300"
            style={{ opacity: tab === "preview" ? 1 : 0 }}
            aria-hidden={tab !== "preview"}
          >
            <V0Stage />
          </div>
          <div
            className="col-start-1 row-start-1 transition-opacity duration-300"
            style={{ opacity: tab === "code" ? 1 : 0 }}
            aria-hidden={tab !== "code"}
          >
            <V0CodePane />
          </div>
        </div>
      </div>

      {/* Refine prompt bar at the bottom — borrows v0's "iterate" pattern */}
      <div className="flex items-center gap-2 border-t border-border/60 bg-background px-4 py-3">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <div className="flex-1 truncate text-[12px] text-muted-foreground">
          Make the welcome banner feel warmer, with a hint of green…
        </div>
        <button
          type="button"
          className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm"
        >
          Refine
        </button>
      </div>
    </div>
  );
}

function V0Stage() {
  return (
    <div
      className="relative isolate overflow-hidden"
      style={{ opacity: 0, animation: "v0-preview-in 600ms ease-out 200ms forwards" }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.09] via-background to-background" />
      {/* Dot grid — masked to a soft center bloom */}
      <div
        className="absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_80%_at_40%_50%,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--muted-foreground)/0.22) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-primary/10 blur-[60px]" />

      {/* Content */}
      <div className="relative flex items-center gap-4 px-7 py-9">
        {/* Left: headline + CTA + social proof */}
        <div className="min-w-0 flex-1">
          {/* Pulsing badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Now live
          </div>

          {/* Headline */}
          <h2 className="mt-4 text-[1.7rem] font-extrabold leading-[1.14] tracking-tight text-foreground">
            Your ideas,
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(130deg, hsl(var(--primary)), hsl(var(--primary)/0.5))",
              }}
            >
              built instantly.
            </span>
          </h2>

          <p className="mt-3 max-w-[200px] text-[12.5px] leading-[1.65] text-muted-foreground">
            Describe what you want. Watch components stream in, live.
          </p>

          {/* CTAs */}
          <div className="mt-6 flex items-center gap-2.5">
            <button
              type="button"
              className="rounded-full bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow"
              style={{ animation: "v0-button-pulse 2.4s ease-in-out infinite" }}
            >
              Start building
            </button>
            <button
              type="button"
              className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See demo →
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-6 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {["bg-rose-400", "bg-amber-400", "bg-emerald-400", "bg-violet-400"].map(
                (c, i) => (
                  <div
                    key={i}
                    className={`h-5 w-5 rounded-full border-2 border-background ${c}`}
                  />
                ),
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">2,400+</span>{" "}
              builders love it
            </p>
          </div>
        </div>

        {/* Right: floating metric cards */}
        <div className="hidden shrink-0 flex-col gap-2 sm:flex" style={{ width: 140 }}>
          {/* Generated today */}
          <div
            className="rounded-xl border border-border/60 bg-card/90 p-3 shadow-sm backdrop-blur"
            style={{ opacity: 0, animation: "v0-card-in 480ms ease-out 480ms forwards" }}
          >
            <p className="text-[10px] text-muted-foreground">Generated today</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
              3,847
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: "72%", animation: "v0-width-in 1s ease-out 900ms backwards" }}
              />
            </div>
            <p className="mt-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
              ↑ 24% this week
            </p>
          </div>

          {/* Avg build time with mini bar chart */}
          <div
            className="rounded-xl border border-border/60 bg-card/90 p-3 shadow-sm backdrop-blur"
            style={{ opacity: 0, animation: "v0-card-in 480ms ease-out 620ms forwards" }}
          >
            <p className="text-[10px] text-muted-foreground">Avg. build time</p>
            <p className="mt-0.5 text-xl font-bold text-foreground">
              4.2
              <span className="text-sm font-medium text-muted-foreground">s</span>
            </p>
            <div className="mt-2 flex h-6 items-end gap-[3px]">
              {[40, 68, 30, 82, 54, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 origin-bottom rounded-sm bg-primary/45"
                  style={{
                    height: `${h}%`,
                    animation: `v0-scale-y-in 0.5s ease-out ${700 + i * 55}ms backwards`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Generating indicator */}
          <div
            className="rounded-xl border border-primary/25 bg-primary/5 p-3"
            style={{ opacity: 0, animation: "v0-card-in 480ms ease-out 760ms forwards" }}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">
                Generating…
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {[68, 42, 80].map((w, i) => (
                <div
                  key={i}
                  className="h-1.5 overflow-hidden rounded-full bg-primary/15"
                >
                  <div
                    className="h-full rounded-full bg-primary/50"
                    style={{
                      width: `${w}%`,
                      animation: `v0-width-in 1s ease-out ${900 + i * 180}ms backwards`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes v0-preview-in {
          from { opacity: 0; transform: translateY(12px) scale(0.982); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0)    scale(1);     filter: blur(0);  }
        }
        @keyframes v0-button-pulse {
          0%, 100% { box-shadow: 0 0 0 0   hsl(var(--primary) / 0.4); }
          50%      { box-shadow: 0 0 0 7px hsl(var(--primary) / 0);   }
        }
        @keyframes v0-card-in {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes v0-width-in {
          from { width: 0%; }
        }
        @keyframes v0-scale-y-in {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

const CODE_LINES = [
  { tab: 0, text: "export function HeroBanner() {" },
  { tab: 1, text: "return (" },
  { tab: 2, text: "<section className=\"rounded-3xl bg-gradient-to-br ..." },
  { tab: 3, text: "<Badge>New</Badge>" },
  { tab: 3, text: "<h3>Welcome aboard.</h3>" },
  { tab: 3, text: "<p>Your account is ready to go.</p>" },
  { tab: 3, text: "<Button>Open the app</Button>" },
  { tab: 2, text: "</section>" },
  { tab: 1, text: ")" },
  { tab: 0, text: "}" },
];

function V0CodePane() {
  return (
    <div className="bg-card font-mono text-[12px] leading-[1.65]">
      <div className="px-5 py-5">
        {CODE_LINES.map((line, i) => (
          <div
            key={i}
            className="flex items-start"
            style={{
              opacity: 0,
              animation: `v0-row-in 380ms ease-out ${i * 80}ms forwards`,
            }}
          >
            <span className="mr-4 select-none text-muted-foreground/40">
              {String(i + 1).padStart(2, " ")}
            </span>
            <span
              className="text-foreground/85"
              style={{ paddingLeft: `${line.tab * 0.9}rem` }}
            >
              {line.text}
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes v0-row-in {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

