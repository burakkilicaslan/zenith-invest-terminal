/**
 * Alternative.me Fear & Greed provider adapter.
 */

import { PROVIDER_POLICIES } from "../config";
import { ProviderError, ProviderValidationError } from "../errors";
import { providerFetch } from "../http";
import { buildHistoryPoints, parseOptionalNumber, type LiveObservation } from "./common";

const ALTERNATIVE_FNG_URL = "https://api.alternative.me/fng/";

interface AlternativeFearGreedRow {
  value?: unknown;
  timestamp?: unknown;
}

interface AlternativeFearGreedResponse {
  data?: AlternativeFearGreedRow[];
}

export async function fetchFearGreedIndex(): Promise<LiveObservation> {
  const url = new URL(ALTERNATIVE_FNG_URL);
  url.searchParams.set("limit", "30");
  url.searchParams.set("format", "json");
  url.searchParams.set("date_format", "unix");

  const payload = (await providerFetch({
    url: url.toString(),
    provider: "Alternative",
    policy: PROVIDER_POLICIES.Alternative,
  })) as AlternativeFearGreedResponse;

  if (!payload || !Array.isArray(payload.data)) {
    throw new ProviderValidationError(
      "Alternative",
      "Fear & Greed: missing data array",
    );
  }

  const series: Array<{ timestamp: string; value: number }> = [];
  for (const row of payload.data) {
    const value = parseOptionalNumber(row.value);
    const tsRaw = parseOptionalNumber(row.timestamp);
    if (value === null || tsRaw === null) continue;
    series.push({
      timestamp: new Date(tsRaw * 1000).toISOString(),
      value,
    });
  }

  if (series.length === 0) {
    throw new ProviderValidationError(
      "Alternative",
      "Fear & Greed: no usable rows",
    );
  }

  series.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const latest = series[series.length - 1];
  const previous = series.length >= 2 ? series[series.length - 2] : null;

  return {
    value: latest.value,
    observedAt: latest.timestamp,
    fetchedAt: new Date().toISOString(),
    previousValue: previous ? previous.value : null,
    history: buildHistoryPoints(series),
  };
}

export function wrapFearGreedError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  return new ProviderError(
    "Alternative",
    "unknown",
    "Alternative.me Fear & Greed request failed",
    { cause: err },
  );
}
