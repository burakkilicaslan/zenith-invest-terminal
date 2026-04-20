/**
 * Financial Modeling Prep (FMP) provider adapter.
 *
 * Used as a secondary source for US Treasury yields (10Y / 2Y). FMP's
 * `/v4/treasury` endpoint returns daily par yields across the curve,
 * which we normalize onto the same `LiveObservation` shape as FRED.
 *
 * Docs: https://site.financialmodelingprep.com/developer/docs/treasury-rates-api
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

const FMP_BASE = "https://financialmodelingprep.com/api";

export type FmpTreasuryTenor =
  | "month1"
  | "month2"
  | "month3"
  | "month6"
  | "year1"
  | "year2"
  | "year3"
  | "year5"
  | "year7"
  | "year10"
  | "year20"
  | "year30";

export interface FmpTreasuryFetchOptions {
  tenor: FmpTreasuryTenor;
  historyLimit?: number;
}

interface FmpTreasuryRow {
  date?: unknown;
  [key: string]: unknown;
}

/**
 * Fetch a single tenor from the FMP treasury endpoint.
 *
 * @throws ProviderError on upstream failures.
 */
export async function fetchFmpTreasury(
  ctx: ProviderFetchContext,
  options: FmpTreasuryFetchOptions,
): Promise<LiveObservation> {
  if (!ctx.apiKey) throw new ProviderMissingKeyError("FMP");

  const historyLimit = Math.max(2, options.historyLimit ?? 14);
  const url = new URL(`${FMP_BASE}/v4/treasury`);
  url.searchParams.set("apikey", ctx.apiKey);

  const payload = (await providerFetch({
    url: url.toString(),
    provider: "FMP",
    policy: PROVIDER_POLICIES.FMP,
  })) as unknown;

  if (!Array.isArray(payload)) {
    throw new ProviderValidationError(
      "FMP",
      "treasury: expected array of daily rows",
    );
  }

  const rows = payload as FmpTreasuryRow[];
  const parsed: Array<{ timestamp: string; value: number }> = [];
  for (const row of rows) {
    const timestamp = toIsoTimestamp(row.date);
    const value = parseOptionalNumber(row[options.tenor]);
    if (timestamp && value !== null) {
      parsed.push({ timestamp, value });
    }
  }

  if (parsed.length === 0) {
    throw new ProviderValidationError(
      "FMP",
      `treasury tenor ${options.tenor}: no usable rows`,
    );
  }

  // FMP returns newest-first. Reverse to oldest-first for the
  // sparkline window we hand back.
  parsed.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const window = parsed.slice(-historyLimit);
  const latest = window[window.length - 1];
  const previous = window.length >= 2 ? window[window.length - 2] : null;
  const fetchedAt = new Date().toISOString();

  return {
    value: latest.value,
    observedAt: latest.timestamp,
    fetchedAt,
    previousValue: previous ? previous.value : null,
    history: buildHistoryPoints(window),
  };
}

export function wrapFmpError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  return new ProviderError("FMP", "unknown", "FMP request failed", {
    cause: err,
  });
}
