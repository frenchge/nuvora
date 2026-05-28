import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatUsd(n: number, opts: { precision?: number } = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.precision ?? 2,
    maximumFractionDigits: opts.precision ?? 2,
  }).format(n);
}

export function formatEur(n: number, opts: { precision?: number } = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: opts.precision ?? 2,
    maximumFractionDigits: opts.precision ?? 2,
  }).format(n);
}

export function startOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export function isoMonth(d = new Date()): string {
  // "YYYY-MM-01" — used as the canonical month key
  const m = startOfMonth(d);
  return m.toISOString().slice(0, 10);
}

export function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function nextMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}
