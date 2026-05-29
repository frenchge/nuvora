"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function ContactForm({
  copy,
}: {
  copy: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    subjectLabel: string;
    subjectPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    privacyPrefix: string;
    privacyLinkText: string;
    privacySuffix: string;
    submit: string;
  };
}) {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={copy.nameLabel}
          name="name"
          placeholder={copy.namePlaceholder}
          required
        />
        <Field
          label={copy.emailLabel}
          name="email"
          type="email"
          placeholder={copy.emailPlaceholder}
          required
        />
      </div>
      <Field
        label={copy.subjectLabel}
        name="subject"
        placeholder={copy.subjectPlaceholder}
      />
      <div className="grid gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {copy.messageLabel}
        </label>
        <textarea
          name="message"
          rows={6}
          placeholder={copy.messagePlaceholder}
          required
          className="w-full resize-y rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground outline-none ring-0 transition-colors focus:border-primary/40 focus:bg-background/95"
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {copy.privacyPrefix}
          <Link href="/legal/privacy" className="underline">
            {copy.privacyLinkText}
          </Link>
          {copy.privacySuffix}
        </p>
        <div className="flex flex-col items-end gap-2">
          <Button type="submit" size="lg">
            <Sparkles className="h-4 w-4" />
            {copy.submit}
          </Button>
          {submitted && (
            <p className="text-xs text-muted-foreground">
              Contact by email is currently unavailable.
            </p>
          )}
        </div>
      </div>
    </form>
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
