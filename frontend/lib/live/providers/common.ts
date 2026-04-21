/**
 * Shared types for provider adapters.
 *
 * Each adapter returns a normalized `LiveObservation` (current value
 * + history) regardless of the upstream payload shape, so the
 * orchestration layer can merge all providers uniformly.
 */

import type { MacroTimeSeriesPoint } from "../../types";

export interface LiveObservation {
  /** Most recent observed value (unit matches the indicator). */
  value: number;
  /** ISO 8601 timestamp the upstream attributed to the value. */
  observedAt: string;
  /** ISO 8601 timestamp the adapter actually fetched the value. */
  fetchedAt: string;
  /**
   * Optional prior-period value, used to derive change / changePercent
   * when the upstream does not return pre-computed deltas.
   */
  previousValue?: number | null;
  /** Recent observations (oldest → newest) for sparklines. */
  history: MacroTimeSeriesPoint[];
}

export interface ProviderFetchContext {
  apiKey: string;
}

/**
 * Parse a numeric field from an upstream response, returning `null`
 * when the upstream encodes "no value" in one of the usual ways.
 */
export function parseOptionalNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    if (raw.trim().length === 0 || raw === ".") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function toIsoTimestamp(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  const parsed = Date.parse(raw.length === 10 ? `${raw}T00:00:00Z` : raw);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function buildHistoryPoints(
  values: Array<{ timestamp: string; value: number }>,
): MacroTimeSeriesPoint[] {
  return values.map((point, i) => ({
    timestamp: point.timestamp,
    value: point.value,
    benchmark: null,
    change: i === 0 ? null : point.value - values[i - 1].value,
  }));
}
