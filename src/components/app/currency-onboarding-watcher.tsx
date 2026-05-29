"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Coins, DollarSign, Euro, PoundSterling } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@convex/_generated/api";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const EURO_REGIONS = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
]);

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    body: string;
    confirm: string;
    labels: Record<Currency, string>;
  }
> = {
  en: {
    eyebrow: "Billing setup",
    title: "Select a currency",
    body: "We'll use this for pricing and checkout throughout your account.",
    confirm: "Save currency",
    labels: {
      USD: "US dollars",
      EUR: "Euros",
      GBP: "British pounds",
    },
  },
  fr: {
    eyebrow: "Configuration de paiement",
    title: "Choisissez une devise",
    body: "Nous l'utiliserons pour les prix et le checkout sur tout votre compte.",
    confirm: "Enregistrer la devise",
    labels: {
      USD: "Dollars americains",
      EUR: "Euros",
      GBP: "Livres sterling",
    },
  },
  es: {
    eyebrow: "Configuracion de pago",
    title: "Selecciona una moneda",
    body: "La usaremos para los precios y el checkout en toda tu cuenta.",
    confirm: "Guardar moneda",
    labels: {
      USD: "Dolares estadounidenses",
      EUR: "Euros",
      GBP: "Libras esterlinas",
    },
  },
  de: {
    eyebrow: "Zahlungseinrichtung",
    title: "Wahrung auswahlen",
    body: "Wir verwenden sie fur Preise und Checkout in deinem gesamten Konto.",
    confirm: "Wahrung speichern",
    labels: {
      USD: "US-Dollar",
      EUR: "Euro",
      GBP: "Britische Pfund",
    },
  },
  it: {
    eyebrow: "Configurazione pagamento",
    title: "Seleziona una valuta",
    body: "La useremo per prezzi e checkout in tutto il tuo account.",
    confirm: "Salva valuta",
    labels: {
      USD: "Dollari statunitensi",
      EUR: "Euro",
      GBP: "Sterline britanniche",
    },
  },
  pt: {
    eyebrow: "Configuracao de pagamento",
    title: "Selecione uma moeda",
    body: "Vamos usa-la para os precos e o checkout em toda a sua conta.",
    confirm: "Guardar moeda",
    labels: {
      USD: "Dolares americanos",
      EUR: "Euros",
      GBP: "Libras esterlinas",
    },
  },
};

const CURRENCY_ICONS = {
  USD: DollarSign,
  EUR: Euro,
  GBP: PoundSterling,
} as const;

function detectBrowserCurrency(): Currency {
  if (typeof navigator === "undefined") {
    return "EUR";
  }

  const primary = navigator.languages?.[0] ?? navigator.language ?? "";
  const normalized = primary.trim().toUpperCase();
  const parts = normalized.split(/[-_]/);
  const region = parts[1] ?? "";

  if (region === "US") return "USD";
  if (region === "GB") return "GBP";
  if (region && EURO_REGIONS.has(region)) return "EUR";

  return "EUR";
}

export function CurrencyOnboardingWatcher() {
  const locale = useLocale() as Locale;
  const copy = COPY[locale] ?? COPY.en;
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const setPreferredCurrency = useMutation(api.users.setPreferredCurrency);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("EUR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsChoice = Boolean(profile && !profile.preferred_currency);
  const options = useMemo(
    () =>
      CURRENCIES.map((currency) => ({
        currency,
        label: copy.labels[currency],
        Icon: CURRENCY_ICONS[currency],
      })),
    [copy.labels],
  );

  useEffect(() => {
    if (!needsChoice) return;
    setSelectedCurrency(detectBrowserCurrency());
  }, [needsChoice]);

  if (!needsChoice) {
    return null;
  }

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[82] bg-black/55 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[83] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-border/60 bg-background shadow-2xl outline-none"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/14 via-primary/5 to-background px-7 pb-6 pt-8">
            <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-14 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-background/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <Coins className="h-3 w-3" />
                {copy.eyebrow}
              </span>
              <Dialog.Title className="mt-4 text-3xl font-semibold tracking-tight">
                {copy.title}
              </Dialog.Title>
              <Dialog.Description className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                {copy.body}
              </Dialog.Description>
            </div>
          </div>

          <div className="space-y-5 px-7 py-6">
            <div className="grid gap-3">
              {options.map(({ currency, label, Icon }) => {
                const active = selectedCurrency === currency;
                return (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => setSelectedCurrency(currency)}
                    className={cn(
                      "flex items-center justify-between rounded-[1.4rem] border px-5 py-4 text-left transition",
                      active
                        ? "border-primary bg-primary/8 shadow-sm"
                        : "border-border/60 bg-background hover:border-primary/45 hover:bg-primary/5",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {currency}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {label}
                        </span>
                      </span>
                    </span>
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full border transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 text-transparent",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              className="h-11 w-full rounded-full"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  await setPreferredCurrency({ currency: selectedCurrency });
                } catch (mutationError) {
                  setError(
                    mutationError instanceof Error
                      ? mutationError.message
                      : "We could not save your currency right now.",
                  );
                  setSaving(false);
                }
              }}
            >
              {saving ? copy.confirm : copy.confirm}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
