/**
 * TCMB (Türkiye Cumhuriyet Merkez Bankası) EVDS provider adapter.
 *
 * The EVDS REST API exposes TCMB-published macro series (policy rate,
 * reserves, CPI, FX) as daily/weekly/monthly observations. Each
 * series is identified by a code (e.g. `TP.APIFON1` for the one-week
 * repo funding rate).
 *
 * Docs: https://evds2.tcmb.gov.tr/help/videos/EVDS_Web_Service_Usage_Guide.pdf
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
  type LiveObservation,
  type ProviderFetchContext,
} from "./common";

const TCMB_BASE = "https://evds2.tcmb.gov.tr/service/evds";

/** EVDS series codes used by the Epic 1 dashboard. */
export const TCMB_SERIES = {
  POLICY_RATE: "TP.APIFON1",
  TCMB_RESERVES: "TP.AB.B2",
  CPI_YOY: "TP.FG.J0",
} as const;

export type TcmbSeriesId = (typeof TCMB_SERIES)[keyof typeof TCMB_SERIES];

export interface TcmbFetchOptions {
  seriesId: TcmbSeriesId;
  /** Frequency parameter: 5 = daily, 4 = weekly, 3 = monthly. */
  frequency?: 3 | 4 | 5;
  /** Rolling window (days) to query. */
  windowDays?: number;
}

interface TcmbRow {
  Tarih?: unknown;
  [key: string]: unknown;
}

interface TcmbResponse {
  items?: TcmbRow[];
  totalCount?: unknown;
}

export async function fetchTcmbSeries(
  ctx: ProviderFetchContext,
  options: TcmbFetchOptions,
): Promise<LiveObservation> {
  if (!ctx.apiKey) throw new ProviderMissingKeyError("TCMB");

  const windowDays = Math.max(30, options.windowDays ?? 120);
  const frequency = options.frequency ?? 5;
  const end = new Date();
  const start = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const url = new URL(TCMB_BASE);
  url.searchParams.set("series", options.seriesId);
  url.searchParams.set("startDate", formatTcmbDate(start));
  url.searchParams.set("endDate", formatTcmbDate(end));
  url.searchParams.set("type", "json");
  url.searchParams.set("frequency", String(frequency));

  const payload = (await providerFetch({
    url: url.toString(),
    provider: "TCMB",
    policy: PROVIDER_POLICIES.TCMB,
    headers: { key: ctx.apiKey },
  })) as TcmbResponse;

  if (!payload || !Array.isArray(payload.items)) {
    throw new ProviderValidationError(
      "TCMB",
      `series ${options.seriesId}: missing items array`,
    );
  }

  // EVDS returns an extra metadata field per series; the value lives
  // under a key that mirrors the series id with dots replaced by
  // underscores (e.g. `TP_APIFON1`).
  const valueKey = options.seriesId.replace(/\./g, "_");
  const parsed: Array<{ timestamp: string; value: number }> = [];
  for (const row of payload.items) {
    const rawDate = typeof row.Tarih === "string" ? row.Tarih : null;
    const value = parseOptionalNumber(row[valueKey]);
    const timestamp = rawDate ? parseTcmbDate(rawDate) : null;
    if (timestamp && value !== null) {
      parsed.push({ timestamp, value });
    }
  }

  if (parsed.length === 0) {
    throw new ProviderValidationError(
      "TCMB",
      `series ${options.seriesId}: no usable rows`,
    );
  }

  parsed.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const window = parsed.slice(-14);
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

function formatTcmbDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function parseTcmbDate(raw: string): string | null {
  // EVDS returns dates as "DD-MM-YYYY" (daily) or "YYYY-M" (monthly).
  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) {
    return new Date(
      Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])),
    ).toISOString();
  }
  const ym = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) {
    return new Date(Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 1)).toISOString();
  }
  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) return new Date(direct).toISOString();
  return null;
}

export function wrapTcmbError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  return new ProviderError("TCMB", "unknown", "TCMB request failed", {
    cause: err,
  });
}
