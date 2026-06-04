"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownUp,
  Lock,
  Check,
  ChevronDown,
  Info,
  Search,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstantTooltip } from "@/components/ui/tooltip";
import { getProviderMeta, getProviderSortRank } from "@/lib/model-providers";
import { cn } from "@/lib/utils";
import type { AppModel, ModelCategory } from "@/lib/types";

const FAVORITE_MODELS_KEY = "vercilio.favoriteModels";

const CATEGORY_ORDER: ModelCategory[] = [
  "small",
  "standard",
  "advanced",
  "premium",
  "elite",
];

const CATEGORY_LABELS: Record<ModelCategory, string> = {
  small: "Light",
  standard: "Balanced",
  advanced: "Capable",
  premium: "Pro",
  elite: "Frontier",
};

/** Cost indicator: $$ green, $$$ orange, $$$$ red, with dimmed unfilled segments */
function CostDots({ model }: { model: AppModel }) {
  const cost = model.estimated_cost_per_message_usd;
  let filled: number;
  let plus = false;
  if (cost === 0 || cost < 0.001) filled = 1;
  else if (cost < 0.005) filled = 2;
  else if (cost < 0.02) filled = 3;
  else if (cost < 0.06) filled = 4;
  else {
    filled = 4;
    plus = true;
  }

  const color =
    filled <= 2
      ? "text-emerald-500"
      : filled === 3
        ? "text-amber-500"
        : "text-rose-500";

  const total = 4;
  return (
    <span className="flex items-center text-xs font-semibold tracking-tighter">
      <span className={color}>{"$".repeat(filled)}</span>
      <span className="text-muted-foreground/25">
        {"$".repeat(total - filled)}
      </span>
      {plus && <span className={color}>+</span>}
    </span>
  );
}

function getCostTier(model: AppModel): 1 | 2 | 3 {
  const cost = model.estimated_cost_per_message_usd;
  if (cost < 0.005) return 1;
  if (cost < 0.02) return 2;
  return 3;
}

function costTone(tier: 1 | 2 | 3, idx: number) {
  if (idx >= tier) return "text-muted-foreground/30";
  if (tier === 1) return "text-emerald-500";
  if (tier === 2) return "text-amber-500";
  return "text-rose-500";
}


function formatCreditCost(credits: number) {
  const rounded = Math.round(credits * 100) / 100;
  return `${rounded} ${rounded === 1 ? "credit" : "credits"} per message`;
}

export function ModelSelector({
  models,
  selectedId,
  onSelect,
  disabled,
  inline = false,
}: {
  models: AppModel[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  inline?: boolean;
}) {
  const selected = models.find((m) => m.model_id === selectedId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [costSort, setCostSort] = useState<"asc" | "desc">("asc");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<ModelCategory>
  >(new Set());
  const deferredQuery = useDeferredValue(query);

  // All unique providers from the model list
  const allProviders = useMemo(
    () =>
      Array.from(new Set(models.map((m) => m.provider))).sort((a, b) => {
        const rankDiff = getProviderSortRank(a) - getProviderSortRank(b);
        return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
      }),
    [models],
  );

  const railProviders = allProviders;

  useEffect(() => {
    const raw = window.localStorage.getItem(FAVORITE_MODELS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFavoriteIds(new Set(parsed.filter((value) => typeof value === "string")));
      }
    } catch {
      // Ignore corrupted local state and keep going.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      FAVORITE_MODELS_KEY,
      JSON.stringify(Array.from(favoriteIds)),
    );
  }, [favoriteIds]);

  function toggleFavorite(modelId: string) {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  }

  const visibleModels = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return models
      .filter((m) => providerFilter === "all" || m.provider === providerFilter)
      .filter((m) => {
        if (!needle) return true;
        return [
          m.display_name,
          m.provider,
          m.model_id,
          m.context_description ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        const favoriteDiff =
          Number(favoriteIds.has(b.model_id)) - Number(favoriteIds.has(a.model_id));
        if (favoriteDiff !== 0) return favoriteDiff;
        const costDiff =
          costSort === "asc"
            ? a.estimated_cost_per_message_usd - b.estimated_cost_per_message_usd
            : b.estimated_cost_per_message_usd - a.estimated_cost_per_message_usd;
        if (costDiff !== 0) return costDiff;
        return a.sort_order - b.sort_order;
      });
  }, [costSort, deferredQuery, favoriteIds, models, providerFilter]);

  const favoriteModels = useMemo(
    () => visibleModels.filter((model) => favoriteIds.has(model.model_id)),
    [favoriteIds, visibleModels],
  );

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: visibleModels.filter(
      (m) => m.category === category && !favoriteIds.has(m.model_id),
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={inline ? "ghost" : "outline"}
          disabled={disabled}
          data-no-translate
          className={cn(
            "min-w-0 shrink justify-start gap-1.5",
            inline
              ? "h-8 rounded-full px-3 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              : "rounded-xl border-border/70 bg-card/80 px-3",
          )}
        >
          <span className="truncate font-medium">
            {selected?.display_name ?? "Select a model"}
          </span>
          {selected && inline && (
            selected.is_free ? (
              <span className="ml-0.5 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Free
              </span>
            ) : (
              <InstantTooltip
                content={formatCreditCost(selected.credit_cost_per_message)}
              >
                <span className="flex shrink-0 items-center gap-0 text-xs opacity-70">
                  {[0, 1, 2].map((idx) => {
                    const tier = getCostTier(selected);
                    return (
                      <span key={idx} className={costTone(tier, idx)}>
                        $
                      </span>
                    );
                  })}
                  <span className="ml-0.5 text-muted-foreground/60">·</span>
                </span>
              </InstantTooltip>
            )
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        data-no-translate
        className="w-[36rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl"
      >
        {/* Search bar */}
        <div className="border-b border-border/50 px-3 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="h-9 rounded-xl border-0 bg-muted/50 pl-9 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-border"
            />
          </div>
        </div>

        <div className="flex" style={{ height: "32rem" }}>
          {/* Provider rail — fixed width, scrolls independently */}
          <div className="hidden w-[4.5rem] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-border/50 py-4 scrollbar-thin sm:flex">
            <ProviderRailButton
              active={providerFilter === "all"}
              label="All"
              glyph="All"
              onClick={() => setProviderFilter("all")}
            />
            {railProviders.map((provider) => {
              const style = getProviderMeta(provider);
              return (
                <ProviderRailButton
                  key={provider}
                  active={providerFilter === provider}
                  label={style.label}
                  glyph={style.glyph}
                  logoUrl={style.logoUrl}
                  onClick={() => setProviderFilter(provider)}
                />
              );
            })}
          </div>

          {/* Model list */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Mobile provider chips */}
            <div className="flex flex-wrap gap-1.5 border-b border-border/50 px-3 py-2 sm:hidden">
              <MiniProviderChip
                active={providerFilter === "all"}
                onClick={() => setProviderFilter("all")}
              >
                All
              </MiniProviderChip>
              {allProviders.map((p) => (
                <MiniProviderChip
                  key={p}
                  active={providerFilter === p}
                  onClick={() => setProviderFilter(p)}
                >
                  {p}
                </MiniProviderChip>
              ))}
            </div>

            <div className="flex items-center justify-end border-b border-border/40 px-3 py-1.5">
              <InstantTooltip
                content={`Cost: ${costSort === "asc" ? "lowest to highest" : "highest to lowest"}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setCostSort((current) => (current === "asc" ? "desc" : "asc"))
                  }
                  className={cn(
                    "flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-medium uppercase tracking-wide transition-colors",
                    costSort === "asc"
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <ArrowDownUp className="h-3 w-3" />
                  Cost
                </button>
              </InstantTooltip>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {favoriteModels.length === 0 && grouped.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No models match that search.
                </div>
              ) : (
                <>
                  {favoriteModels.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        Favorites
                      </div>
                      {favoriteModels.map((model) => (
                        <ModelRow
                          key={model.model_id}
                          model={model}
                          selectedId={selectedId}
                          onSelect={onSelect}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={favoriteIds.has(model.model_id)}
                          closeMenu={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  )}
                  {grouped.map((group) => {
                    const collapsed = collapsedCategories.has(group.category);
                    return (
                      <div key={group.category}>
                        <button
                          type="button"
                          onClick={() => {
                            setCollapsedCategories((current) => {
                              const next = new Set(current);
                              if (next.has(group.category)) {
                                next.delete(group.category);
                              } else {
                                next.add(group.category);
                              }
                              return next;
                            });
                          }}
                          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                          aria-expanded={!collapsed}
                        >
                          <ChevronDown
                            className={cn(
                              "h-3 w-3 shrink-0 transition-transform duration-200",
                              collapsed && "-rotate-90",
                            )}
                          />
                          <span>{CATEGORY_LABELS[group.category]}</span>
                          <span className="ml-auto text-muted-foreground/35 normal-case tracking-normal">
                            {group.items.length}
                          </span>
                        </button>
                        {!collapsed &&
                          group.items.map((model) => (
                            <ModelRow
                              key={model.model_id}
                              model={model}
                              selectedId={selectedId}
                              onSelect={onSelect}
                              onToggleFavorite={toggleFavorite}
                              isFavorite={favoriteIds.has(model.model_id)}
                              closeMenu={() => setOpen(false)}
                            />
                          ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProviderRailButton({
  active,
  label,
  glyph,
  logoUrl,
  onClick,
}: {
  active: boolean;
  label: string;
  glyph: string;
  logoUrl?: string;
  onClick: () => void;
}) {
  return (
    <InstantTooltip content={label}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-150",
          active
            ? "bg-accent/80 text-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        {logoUrl ? (
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full">
            <img
              src={logoUrl}
              alt=""
              className={cn(
                "h-6 w-6 object-contain dark:invert",
                active ? "opacity-100" : "opacity-60 group-hover:opacity-100",
              )}
            />
          </span>
        ) : (
          <span className="text-[11px] font-bold tracking-tight">{glyph}</span>
        )}
      </button>
    </InstantTooltip>
  );
}

function ModelRow({
  model,
  selectedId,
  onSelect,
  onToggleFavorite,
  isFavorite,
  closeMenu,
}: {
  model: AppModel;
  selectedId: string;
  onSelect: (id: string) => void;
  onToggleFavorite: (modelId: string) => void;
  isFavorite: boolean;
  closeMenu: () => void;
}) {
  const provider = getProviderMeta(model.provider);
  const isSelected = model.model_id === selectedId;
  const canUse = model.can_use !== false;

  return (
    <div
      role="button"
      tabIndex={canUse ? 0 : -1}
      onClick={() => {
        if (!canUse) return;
        onSelect(model.model_id);
        closeMenu();
      }}
      onKeyDown={(event) => {
        if (!canUse) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(model.model_id);
          closeMenu();
        }
      }}
      aria-disabled={!canUse}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed",
        isSelected ? "bg-primary/8" : canUse ? "hover:bg-accent/50" : "opacity-45",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center text-foreground/60",
          !canUse && "grayscale",
        )}
      >
        {provider.logoUrl ? (
          <img
            src={provider.logoUrl}
            alt=""
            className={cn(
              "h-5 w-5 object-contain dark:invert",
              !canUse && "opacity-60",
            )}
          />
        ) : (
          <span className="text-sm font-semibold">{provider.glyph}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              isSelected && canUse && "text-primary",
              !canUse && "text-muted-foreground",
            )}
          >
            {model.display_name}
          </span>
          {model.is_free ? (
            <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Free
            </span>
          ) : (
            <InstantTooltip
              content={formatCreditCost(model.credit_cost_per_message)}
            >
              <span>
                <CostDots model={model} />
              </span>
            </InstantTooltip>
          )}
          {!canUse && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <Lock className="h-2.5 w-2.5" />
              Upgrade
            </span>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground/70">
          {model.context_description ?? "General-purpose model for chat and tasks."}
        </div>
      </div>

      <InstantTooltip content={isFavorite ? "Remove favorite" : "Add favorite"}>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(model.model_id);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              isFavorite && "fill-amber-400 text-amber-400",
            )}
          />
        </button>
      </InstantTooltip>

      <InstantTooltip
        content={model.context_description ?? "General-purpose model for chat and tasks."}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground/35",
            canUse && "hover:text-muted-foreground/70",
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </span>
      </InstantTooltip>

      {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </div>
  );
}

function MiniProviderChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/10 text-foreground"
          : "border-border/60 bg-background text-muted-foreground hover:bg-accent/50",
      )}
    >
      {children}
    </button>
  );
}
