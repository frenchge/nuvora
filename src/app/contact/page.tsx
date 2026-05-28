import Link from "next/link";
import {
  ArrowRight,
  HelpCircle,
  Leaf,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contact — Nuvora",
  description:
    "Talk to a real person about Nuvora — billing questions, partnership ideas, or just to say hi.",
};

const CONTACT_LANES = [
  {
    icon: Mail,
    label: "General",
    address: "hello@nuvora.ai",
    helper: "Anything that doesn't fit elsewhere — we usually reply within a day.",
  },
  {
    icon: HelpCircle,
    label: "Support",
    address: "support@nuvora.ai",
    helper: "Stuck on something specific? Send the chat ID or a screenshot if you can.",
  },
  {
    icon: Leaf,
    label: "Partnerships",
    address: "partners@nuvora.ai",
    helper: "Restoration partners, model providers, sustainability orgs — let's talk.",
  },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-[400px] bg-[radial-gradient(60%_50%_at_50%_30%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="container relative pt-24 pb-12 text-center md:pt-32">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <MessageCircle className="h-3 w-3 text-primary" />
            We&apos;re a small team — humans answer.
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Say <span className="text-primary">hi.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-7 text-muted-foreground md:text-lg">
            Pick the inbox that fits, or use the form below. We read every
            message and try to reply within one working day.
          </p>
        </div>
      </section>

      <section className="container pb-12">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {CONTACT_LANES.map(({ icon: Icon, label, address, helper }) => (
            <a
              key={address}
              href={`mailto:${address}`}
              className="group rounded-3xl border border-border/60 bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
              <div className="mt-1 font-semibold tracking-tight">{address}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {helper}
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open mail
                <ArrowRight className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="container pb-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-border/60 bg-card/40 p-8 sm:p-10">
          <h2 className="text-balance text-2xl font-semibold tracking-tight">
            Or drop us a note
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us what you&apos;re working on. We&apos;ll route it to the
            right person.
          </p>

          <form
            className="mt-8 grid gap-5"
            // The form posts to a `mailto:` so this works without a backend.
            // Replace with your own endpoint when one is ready.
            action="mailto:hello@nuvora.ai"
            method="post"
            encType="text/plain"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" name="name" placeholder="Avery Hale" required />
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <Field
              label="Subject"
              name="subject"
              placeholder="What's on your mind?"
            />
            <div className="grid gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Message
              </label>
              <textarea
                name="message"
                rows={6}
                placeholder="Tell us what's going on…"
                required
                className="w-full resize-y rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary/40 focus:bg-background/95"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                By sending you accept our{" "}
                <Link href="/legal/privacy" className="underline">
                  privacy policy
                </Link>
                .
              </p>
              <Button type="submit" size="lg">
                <Sparkles className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email";
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-2xl border border-border/60 bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40"
      />
    </div>
  );
}
