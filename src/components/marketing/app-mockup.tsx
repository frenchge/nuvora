import {
  ArrowDown,
  ChevronDown,
  Code2,
  FileText,
  Image as ImageIcon,
  LogOut,
  Moon,
  Paperclip,
  PanelLeftClose,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getProviderMeta } from "@/lib/model-providers";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

type Variant = "chat" | "settings";

const PINNED_CHATS = ["hi"];

const RECENT_CHATS = [
  "Indie Coffee Shop Name Ideas",
  "3-Minute Pitch Outline for Seed",
  "How does AI actually work, simply?",
  "Explain quantum entanglement",
  "30-Day Spanish Learning Plan",
  'Counting Letters In "Strawberry"',
  "Philosophical Perspectives on Time",
  "Are black holes real, and why?",
  "Understanding How AI Works",
  "Casual Coolness Check",
  "Casual Check-In Conversation",
];

const PROVIDER_MARQUEE = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Meta",
  "xAI",
  "DeepSeek",
  "Mistral",
  "Cohere",
  "Perplexity",
  "Alibaba",
];

const ASSISTANT_LINES = [
  "Here are five indie coffee shop name ideas for a coastal town:",
  "1. Tide & Bean",
  "2. Harbor Roast",
  "3. Saltwind Coffee",
  "4. The Drifting Cup",
  "5. Seabird Sip",
  "",
  "If you want, I can also give you:",
  "• more artsy/bohemian names,",
  "• more upscale/minimal names, or",
  "• names that sound more local and nautical.",
];

export function AppMockup({
  variant = "chat",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-2xl shadow-black/10 ring-1 ring-black/5",
        className,
      )}
    >
      <div className="flex h-11 items-center gap-2 border-b border-border/60 bg-card px-4">
        <span className="h-3 w-3 rounded-full bg-rose-400/70" />
        <span className="h-3 w-3 rounded-full bg-amber-400/70" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        <div className="mx-auto text-xs text-muted-foreground/80">http://localhost:3000</div>
      </div>

      <div className="flex h-[640px] bg-card sm:h-[720px]">
        <Sidebar />
        <Content variant={variant} />
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-card md:flex">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <BrandLogo className="h-7 w-7" />
        <button
          type="button"
          tabIndex={-1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <TopPill icon={Sparkles} label="Integrations" />
        <TopPill icon={ImageIcon} label="Canva" />
        <TopPill icon={Code2} label="Code" />
      </div>

      <div className="px-4 pb-4">
        <div className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
          <Plus className="h-4 w-4" />
          New Chat
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4 shrink-0" />
          Search your threads...
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-4">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
          <Pin className="h-3.5 w-3.5" />
          Pinned
          <ChevronDown className="ml-auto h-3.5 w-3.5" />
        </div>
        {PINNED_CHATS.map((title) => (
          <ChatRow key={title} title={title} />
        ))}

        <div className="mt-4 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
          Recent
        </div>
        <div className="space-y-0.5">
          {RECENT_CHATS.map((title, index) => (
            <ChatRow key={title} title={title} active={index === 0} />
          ))}
        </div>
      </div>

      <div className="space-y-1 px-4 pb-4 pt-2">
        <FooterRow label="Community" icon={Sparkles} />
        <FooterRow label="Settings" icon={Settings} />
        <div className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-foreground/75">
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </div>
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
}

function TopPill({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <div className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border border-border/60 bg-background/45 text-[11px] text-foreground/75">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}

function ChatRow({
  title,
  active,
}: {
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "truncate rounded-2xl px-3 py-2.5 text-[13px] text-foreground/75",
        active && "bg-secondary text-foreground",
      )}
    >
      {title}
    </div>
  );
}

function FooterRow({
  label,
  icon: Icon = Sparkles,
}: {
  label: string;
  icon?: typeof Sparkles;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-foreground/75">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </div>
  );
}

function Content({ variant }: { variant: Variant }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-card">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-tl-[2rem] border-l border-t border-border/50 bg-background">
        {variant === "chat" ? <ChatBody /> : <SettingsBody />}
      </div>
    </div>
  );
}

function ChatBody() {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden px-8 pb-0 pt-8 sm:px-12">
        <div className="flex h-full min-h-0 flex-col">
          <div className="ml-auto max-w-[38rem] rounded-2xl bg-secondary px-5 py-3 text-sm text-foreground/75">
            Brainstorm five names for an indie coffee shop in a coastal town.
          </div>

          <div className="mx-auto mt-12 w-full max-w-3xl flex-1">
            <div className="text-[15px] leading-8 text-foreground/80">
              {ASSISTANT_LINES.map((line, index) =>
                line === "" ? (
                  <div key={`space-${index}`} className="h-3" />
                ) : (
                  <div
                    key={line}
                    className={cn(
                      line.startsWith("1.") ||
                        line.startsWith("2.") ||
                        line.startsWith("3.") ||
                        line.startsWith("4.") ||
                        line.startsWith("5.")
                        ? "pl-2 font-medium text-foreground"
                        : line.startsWith("•")
                          ? "pl-3 text-foreground/75"
                          : "",
                    )}
                  >
                    {line}
                  </div>
                ),
              )}
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="uppercase tracking-wide">GPT Mini Latest</span>
              <span className="inline-flex items-center gap-2 text-foreground/80">
                <FileText className="h-4 w-4" />
                Copy
              </span>
              <span className="inline-flex items-center gap-2 text-foreground/80">
                <Wand2 className="h-4 w-4" />
                Retry
              </span>
              <span className="text-foreground/80">GPT Mini Latest</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 sm:px-10">
        <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-card px-5 pb-4 pt-4">
          <div className="min-h-24 text-[16px] text-muted-foreground/65">
            Type your message here...
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-foreground/75">
                GPT Mini Latest
                <span className="text-primary/50">$$$.</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              <ComposerPill>
                <Sparkles className="h-3.5 w-3.5" />
                Auto
              </ComposerPill>
              <ComposerPill active>Off</ComposerPill>
              <ComposerPill activeSearch>
                <Search className="h-3.5 w-3.5" />
                Search
              </ComposerPill>
            </div>
            <div className="flex items-center gap-4">
              <Paperclip className="h-5 w-5 text-foreground/65" />
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Send className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ComposerPill({
  children,
  active,
  activeSearch,
}: {
  children: React.ReactNode;
  active?: boolean;
  activeSearch?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm",
        active && "bg-background text-foreground shadow-sm",
        activeSearch && "bg-primary/12 text-primary",
        !active && !activeSearch && "text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function SettingsBody() {
  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-[220px] shrink-0 border-r border-border/50 px-6 py-6 lg:block">
        <div className="space-y-2 text-sm">
          {["Personal info", "Billing", "Contribution", "Security"].map(
            (label, index) => (
              <div
                key={label}
                className={cn(
                  "rounded-full px-3 py-2",
                  index === 2 ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </aside>

      <div className="min-h-0 flex-1 px-8 py-8">
        <h2 className="text-2xl font-semibold tracking-tight">Contribution</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Track the trees planted and bottles collected through your plan and
          one-time purchases.
        </p>

        <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
            Monthly
          </span>
          <span>Yearly</span>
          <span>All time</span>
        </div>

        <div className="mt-6 grid grid-cols-[1.15fr_1fr_1fr] gap-5">
          <div>
            <div className="text-base font-medium">Contribution</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Real activity funded through our restoration partners.
            </p>
          </div>
          <MetricPanel label="Trees planted" value="12" active />
          <MetricPanel label="Bottles collected" value="86" />
        </div>

        <FakeBars />
      </div>
    </div>
  );
}

function FakeBars() {
  const heights = [24, 36, 18, 54, 30, 66, 26, 44, 32, 62, 40, 28];
  return (
    <div className="mt-10 flex h-40 items-end gap-2">
      {heights.map((height, index) => (
        <div
          key={index}
          className="flex-1 rounded-md bg-primary/65"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function MetricPanel({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] px-5 py-5",
        active ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-foreground",
      )}
    >
      <div
        className={cn(
          "text-[11px] uppercase tracking-wide",
          active ? "text-primary-foreground/80" : "text-muted-foreground/80",
        )}
      >
        {label}
      </div>
      <div className="mt-2 text-4xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export function ProviderLogoMarquee({ className }: { className?: string }) {
  const items = [...PROVIDER_MARQUEE, ...PROVIDER_MARQUEE];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[hsl(var(--accent))] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[hsl(var(--accent))] to-transparent" />
      <div className="flex min-w-max animate-[marquee_28s_linear_infinite] items-center gap-10">
        {items.map((provider, index) => {
          const meta = getProviderMeta(provider);
          return (
            <div
              key={`${provider}-${index}`}
              className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-foreground/65"
            >
              {meta.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.logoUrl}
                  alt={meta.label}
                  className="h-5 w-5 object-contain dark:invert"
                />
              ) : (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                  {meta.glyph}
                </span>
              )}
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppMockupScrollHint({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <ArrowDown className="h-3 w-3" />
        Scroll to explore
      </span>
    </div>
  );
}
