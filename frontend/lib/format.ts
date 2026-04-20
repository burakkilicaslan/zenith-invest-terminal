// UI-only number and date formatters. The wire contract stays numeric;
// formatting lives in the UI layer per the domain schema rules.

import type { IndicatorUnit } from "./types";

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const SIGNED_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

/** `value` is a percent expressed as a percentage (e.g. `0.385` → `+0.39%`). */
export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value / 100);
}

export function formatSigned(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: "exceptZero",
  }).format(value);
}

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Format an indicator value in its native unit for display. */
export function formatIndicatorValue(value: number, unit: IndicatorUnit): string {
  switch (unit) {
    case "percent":
      return `${value.toFixed(2)}%`;
    case "bps":
      return `${Math.round(value)} bps`;
    case "index":
      return value.toFixed(2);
    case "usd_trillions":
      return `$${value.toFixed(2)}T`;
    case "usd_billions":
      return `$${value.toFixed(1)}B`;
    case "ratio":
      return value.toFixed(2);
    default: {
      const _exhaustive: never = unit;
      return String(_exhaustive);
    }
  }
}

/** Format an indicator delta for display (native unit). */
export function formatIndicatorChange(
  change: number,
  unit: IndicatorUnit,
): string {
  switch (unit) {
    case "percent":
      return `${formatSigned(change, 2)} pp`;
    case "bps":
      return `${formatSigned(change, 0)} bps`;
    case "index":
      return formatSigned(change, 2);
    case "usd_trillions":
      return `${formatSigned(change, 2)}T`;
    case "usd_billions":
      return `${formatSigned(change, 1)}B`;
    case "ratio":
      return formatSigned(change, 2);
    default: {
      const _exhaustive: never = unit;
      return String(_exhaustive);
    }
  }
}

// Suppress unused-warning for when only some helpers are imported.
export { SIGNED_NUMBER_FORMATTER };
