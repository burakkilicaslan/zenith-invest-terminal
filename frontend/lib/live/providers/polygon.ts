/**
 * Polygon.io provider adapter.
 *
 * Polygon is only used for a narrow slice of macro-adjacent feeds
 * (currently: VIX close via the `I:VIX` index aggregate). The
 * orchestration layer treats it as a secondary source behind FRED.
 *
 * Docs: https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksticker__prev
 */

import { PROVIDER_POLICIES } from "../config";
import {
  ProviderError,
  ProviderMissingKeyError,
  ProviderValidationError,
} from "../errors";
import { providerFetch } from "../http";
import {
  parseOptionalNumber,
  type LiveObservation,
  type ProviderFetchContext,
} from "./common";
import type { MacroTimeSeriesPoint } from "../../types";

const POLYGON_BASE = "https://api.polygon.io";

export interface PolygonIndexAggOptions {
  /** Polygon ticker (e.g. "I:VIX"). */
  ticker: string;
  /** How many days of history to request for the sparkline. */
  historyDays?: number;
}

interface PolygonAggResult {
  c?: unknown;
  t?: unknown;
}

interface PolygonAggResponse {
  results?: PolygonAggResult[];
  resultsCount?: unknown;
  status?: unknown;
}

export async function fetchPolygonIndexAgg(
  ctx: ProviderFetchContext,
  options: PolygonIndexAggOptions,
): Promise<LiveObservation> {
  if (!ctx.apiKey) throw new ProviderMissingKeyError("Polygon");

  const historyDays = Math.max(7, options.historyDays ?? 30);
  const end = new Date();
  const start = new Date(end.getTime() - historyDays * 24 * 60 * 60 * 1000);
  const format = (d: Date) => d.toISOString().slice(0, 10);
  const url = new URL(
    `${POLYGON_BASE}/v2/aggs/ticker/${encodeURIComponent(options.ticker)}/range/1/day/${format(start)}/${format(end)}`,
  );
  url.searchParams.set("adjusted", "true");
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", String(historyDays + 5));
  url.searchParams.set("apiKey", ctx.apiKey);

  const payload = (await providerFetch({
    url: url.toString(),
    provider: "Polygon",
    policy: PROVIDER_POLICIES.Polygon,
  })) as PolygonAggResponse;

  const results = Array.isArray(payload?.results) ? payload.results : [];
  if (results.length === 0) {
    throw new ProviderValidationError(
      "Polygon",
      `ticker ${options.ticker}: empty aggregate results`,
    );
  }

  const history: MacroTimeSeriesPoint[] = [];
  let previousValue: number | null = null;
  for (const row of results) {
    const close = parseOptionalNumber(row.c);
    const ts = parseOptionalNumber(row.t);
    if (close === null || ts === null) continue;
    const timestamp = new Date(ts).toISOString();
    history.push({
      timestamp,
      value: close,
      benchmark: null,
      change: previousValue === null ? null : close - previousValue,
    });
    previousValue = close;
  }

  if (history.length === 0) {
    throw new ProviderValidationError(
      "Polygon",
      `ticker ${options.ticker}: no usable aggregate rows`,
    );
  }

  const latest = history[history.length - 1];
  const prior = history.length >= 2 ? history[history.length - 2] : null;
  const fetchedAt = new Date().toISOString();

  return {
    value: latest.value,
    observedAt: latest.timestamp,
    fetchedAt,
    previousValue: prior ? prior.value : null,
    history,
  };
}

export function wrapPolygonError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  return new ProviderError("Polygon", "unknown", "Polygon request failed", {
    cause: err,
  });
}
