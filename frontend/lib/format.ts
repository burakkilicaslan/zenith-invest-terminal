// UI-only number and date formatters. The wire contract is numeric;
// formatting lives in the UI layer per the domain schema rules.

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});

export function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(value);
}

/** `value` is a percent expressed as a percentage (e.g. `0.385` -> `+0.39%`). */
export function formatPercent(value: number): string {
  return PERCENT_FORMATTER.format(value / 100);
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
