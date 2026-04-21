/**
 * FRED provider adapter.
 *
 * Resolves macro observations from the St. Louis Fed's FRED API.
 * Each mapped series is normalized into a `LiveObservation`; the
 * orchestration layer assembles those into the Epic 1 indicators.
 *
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */

import { PROVIDER_POLICIES } from "../config";
import {
  ProviderError,
  ProviderMissingKeyError,
  ProviderValidationError,
} from "../errors";
import { providerFetch } from "../http";
import {
  buildHistoryPoints,
  parseOptionalNumber,
  toIsoTimestamp,
  type LiveObservation,
  type ProviderFetchContext,
} from "./common";

const FRED_BASE = "https://api.stlouisfed.org/fred";

/** Series ids used by the Epic 1 dashboard. */
export const FRED_SERIES = {
  US_10Y: "DGS10",
  US_2Y: "DGS2",
  US_10Y_2Y_SPREAD: "T10Y2Y",
  US_VIX: "VIXCLS",
  US_FED_BALANCE_SHEET: "WALCL",
} as const;

export type FredSeriesId = (typeof FRED_SERIES)[keyof typeof FRED_SERIES];

interface FredObservation {
  date?: unknown;
  value?: unknown;
}

interface FredObservationsResponse {
  observations?: FredObservation[];
}

export interface FredFetchOptions {
  seriesId: FredSeriesId;
  /** Limit the history points returned to the UI (most-recent N). */
  historyLimit?: number;
}

/**
 * Fetch the most recent observations for a FRED series.
 *
 * @throws ProviderError on upstream failures.
 */
export async function fetchFredSeries(
  ctx: ProviderFetchContext,
  options: FredFetchOptions,
): Promise<LiveObservation> {
  if (!ctx.apiKey) throw new ProviderMissingKeyError("FRED");

  const historyLimit = Math.max(2, options.historyLimit ?? 14);
  const url = new URL(`${FRED_BASE}/series/observations`);
  url.searchParams.set("series_id", options.seriesId);
  url.searchParams.set("api_key", ctx.apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", String(historyLimit));

  const payload = (await providerFetch({
    url: url.toString(),
    provider: "FRED",
    policy: PROVIDER_POLICIES.FRED,
  })) as FredObservationsResponse;

  if (!payload || !Array.isArray(payload.observations)) {
    throw new ProviderValidationError(
      "FRED",
      `series ${options.seriesId}: missing observations array`,
    );
  }

  const parsed: Array<{ timestamp: string; value: number }> = [];
  for (const obs of payload.observations) {
    const timestamp = toIsoTimestamp(obs.date);
    const value = parseOptionalNumber(obs.value);
    if (timestamp && value !== null) {
      parsed.push({ timestamp, value });
    }
  }

  if (parsed.length === 0) {
    throw new ProviderValidationError(
      "FRED",
      `series ${options.seriesId}: no usable observations`,
    );
  }

  // FRED returns newest-first when sort_order=desc. We want oldest-first
  // for history (so the sparkline reads left→right) and the newest
  // entry as the headline value.
  parsed.reverse();
  const latest = parsed[parsed.length - 1];
  const previous = parsed.length >= 2 ? parsed[parsed.length - 2] : null;
  const fetchedAt = new Date().toISOString();

  return {
    value: latest.value,
    observedAt: latest.timestamp,
    fetchedAt,
    previousValue: previous ? previous.value : null,
    history: buildHistoryPoints(parsed),
  };
}

/**
 * Narrow helper for the orchestration layer to translate unexpected
 * JS errors (e.g. a network stack failure mid-retry) into a typed
 * provider error.
 */
export function wrapFredError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  return new ProviderError("FRED", "unknown", "FRED request failed", {
    cause: err,
  });
}
