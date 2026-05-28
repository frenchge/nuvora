import type { Appearance } from "@clerk/types";

// Shared Clerk styling for the sign-in / sign-up pages. Keeps the embedded
// form visually consistent with the rest of the app and avoids the default
// light-card-on-dark-background clash that ships out of the box.
export const clerkAuthAppearance: Appearance = {
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorBackground: "hsl(var(--card))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    colorInputBackground: "hsl(var(--input))",
    colorInputText: "hsl(var(--foreground))",
    colorDanger: "hsl(var(--destructive))",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-sans, ui-sans-serif, system-ui)",
  },
  elements: {
    rootBox: "w-full",
    card:
      "w-full rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm",
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    main: "gap-4",
    socialButtonsBlockButton:
      "h-11 rounded-xl border border-border/60 bg-background/70 text-foreground shadow-none transition-colors hover:bg-accent",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-border/60",
    dividerText:
      "text-xs uppercase tracking-[0.16em] text-muted-foreground",
    formFieldLabel: "text-sm font-medium text-foreground/80",
    formFieldInput:
      "h-11 rounded-xl border border-border/60 bg-input text-foreground shadow-none placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15",
    formFieldHintText: "text-xs text-muted-foreground",
    formFieldErrorText: "text-xs text-destructive",
    formButtonPrimary:
      "h-11 rounded-xl bg-primary text-primary-foreground font-medium shadow-none transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-primary/30",
    footer:
      "rounded-b-2xl bg-transparent border-t border-border/50 mt-4 pt-4",
    footerAction: "text-sm text-muted-foreground",
    footerActionText: "text-muted-foreground",
    footerActionLink:
      "text-primary font-medium hover:text-primary/80 transition-colors",
    footerPages: "hidden",
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/80",
    formFieldAction: "text-primary hover:text-primary/80",
    badge:
      "rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground",
    alternativeMethodsBlockButton:
      "h-11 rounded-xl border border-border/60 bg-background/70 text-foreground hover:bg-accent",
  },
};
