// UI-only number and date formatters. The wire contract stays numeric;
// formatting lives in the UI layer per the domain schema rules.
//
// Dashboard copy is Turkish-first (Epic 1 enrichment), so the locale
// below is `tr-TR`. Numbers still format consistently with tabular
// numerals on the cards.

import type { IndicatorUnit } from "./types";

const LOCALE = "tr-TR";

const PERCENT_FORMATTER = new Intl.NumberFormat(LOCALE, {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const SIGNED_NUMBER_FORMATTER = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const NUMBER_FORMATTER = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 4,
});

/** `value` is a percent expressed as a percentage (e.g. `0.385` → `+%0,39`). */
export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value / 100);
}

export function formatSigned(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: "exceptZero",
  }).format(value);
}

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatFixed(value: number, digits: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Format an indicator value in its native unit for display. */
export function formatIndicatorValue(value: number, unit: IndicatorUnit): string {
  switch (unit) {
    case "percent":
      return `%${formatFixed(value, 2)}`;
    case "bps":
      return `${Math.round(value)} bp`;
    case "index":
      return formatFixed(value, 2);
    case "usd_trillions":
      return `${formatFixed(value, 2)} T$`;
    case "usd_billions":
      return `${formatFixed(value, 1)} Mr$`;
    case "ratio":
      return formatFixed(value, 2);
    case "score":
      return `${Math.round(value)} / 100`;
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
      return `${formatSigned(change, 0)} bp`;
    case "index":
      return formatSigned(change, 2);
    case "usd_trillions":
      return `${formatSigned(change, 2)} T$`;
    case "usd_billions":
      return `${formatSigned(change, 1)} Mr$`;
    case "ratio":
      return formatSigned(change, 2);
    case "score":
      return `${formatSigned(change, 0)} puan`;
    default: {
      const _exhaustive: never = unit;
      return String(_exhaustive);
    }
  }
}

// Suppress unused-warning for when only some helpers are imported.
export { SIGNED_NUMBER_FORMATTER };
