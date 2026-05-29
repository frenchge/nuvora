"use client";

import { useState, useTransition } from "react";
import { useMutation } from "convex/react";
import { Check, DollarSign, Euro, PoundSterling } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{
  value: Currency;
  label: string;
  description: string;
  Icon: typeof DollarSign;
}> = [
  {
    value: "USD",
    label: "USD",
    description: "US dollars",
    Icon: DollarSign,
  },
  {
    value: "EUR",
    label: "EUR",
    description: "Euros",
    Icon: Euro,
  },
  {
    value: "GBP",
    label: "GBP",
    description: "British pounds",
    Icon: PoundSterling,
  },
];

export function CurrencyPreferenceSelector({
  currentCurrency,
}: {
  currentCurrency: Currency;
}) {
  const router = useRouter();
  const setPreferredCurrency = useMutation(api.users.setPreferredCurrency);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currentCurrency);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function saveCurrency() {
    setError(null);

    try {
      await setPreferredCurrency({ currency: selectedCurrency });
      startTransition(() => {
        router.refresh();
      });
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "We could not update your currency right now.",
      );
    }
  }

  return (
    <div className="space-y-4 rounded-[1.8rem] border border-border/60 bg-muted/20 p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Billing currency</h3>
        <p className="text-sm text-muted-foreground">
          Choose the currency we use for prices and Stripe checkout.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {OPTIONS.map(({ value, label, description, Icon }) => {
          const active = selectedCurrency === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedCurrency(value)}
              className={cn(
                "rounded-[1.35rem] border px-4 py-4 text-left transition",
                active
                  ? "border-primary bg-primary/8 shadow-sm"
                  : "border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
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
              </div>
              <div className="mt-4 text-sm font-semibold text-foreground">
                {label}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {description}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={isPending || selectedCurrency === currentCurrency}
          onClick={saveCurrency}
        >
          {isPending ? "Saving..." : "Save currency"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Current selection: {currentCurrency}
        </p>
      </div>
    </div>
  );
}
