/**
 * Yahoo Finance-based proxy adapter for the CAN SLIM exposure tile.
 *
 * The product uses this as a live sentiment proxy, not as a direct
 * first-party Investors.com feed. We derive a 0-100 exposure score
 * from recent SPY closing prices so the dashboard can stay fully
 * self-contained.
 */

import { PROVIDER_POLICIES } from "../config";
import { ProviderError, ProviderValidationError } from "../errors";
import { providerFetch } from "../http";
import { buildHistoryPoints, type LiveObservation } from "./common";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/SPY";

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: unknown;
      indicators?: {
        quote?: Array<{
          close?: unknown;
        }>;
      };
    }>;
  };
}

export async function fetchCanSlimExposure(): Promise<LiveObservation> {
  const url = new URL(YAHOO_CHART_URL);
  url.searchParams.set("range", "3mo");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("includePrePost", "false");
  url.searchParams.set("events", "div,splits");

  const payload = (await providerFetch({
    url: url.toString(),
    provider: "Yahoo",
    policy: PROVIDER_POLICIES.Yahoo,
  })) as YahooChartResponse;

  const result = payload.chart?.result?.[0];
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : null;
  const closes = result?.indicators?.quote?.[0]?.close;

  if (!timestamps || !Array.isArray(closes)) {
    throw new ProviderValidationError(
      "Yahoo",
      "CAN SLIM proxy: missing timestamps or close series",
    );
  }

  const series: Array<{ timestamp: string; value: number }> = [];
  for (let i = 0; i < Math.min(timestamps.length, closes.length); i += 1) {
    const tsRaw = timestamps[i];
    const close = typeof closes[i] === "number" && Number.isFinite(closes[i]) ? closes[i] : null;
    if (typeof tsRaw === "number" && close !== null) {
      series.push({
        timestamp: new Date(tsRaw * 1000).toISOString(),
        value: close,
      });
    }
  }

  if (series.length === 0) {
    throw new ProviderValidationError(
      "Yahoo",
      "CAN SLIM proxy: no usable price points",
    );
  }

  series.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const exposureSeries = buildExposureSeries(series);
  const latest = exposureSeries[exposureSeries.length - 1];
  const previous = exposureSeries.length >= 2 ? exposureSeries[exposureSeries.length - 2] : null;

  return {
    value: latest.value,
    observedAt: latest.timestamp,
    fetchedAt: new Date().toISOString(),
    previousValue: previous ? previous.value : null,
    history: buildHistoryPoints(exposureSeries),
  };
}

function buildExposureSeries(series: Array<{ timestamp: string; value: number }>): Array<{
  timestamp: string;
  value: number;
}> {
  return series.map((point, index, all) => ({
    timestamp: point.timestamp,
    value: computeExposure(all.slice(0, index + 1).map((row) => row.value)),
  }));
}

function computeExposure(values: number[]): number {
  if (values.length === 0) return 50;
  if (values.length === 1) return 50;
  const latest = values[values.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 50;
  const normalized = ((latest - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export function wrapCanSlimError(err: unknown): ProviderError {
  if (err instanceof ProviderError) return err;
  return new ProviderError("Yahoo", "unknown", "Yahoo CAN SLIM request failed", {
    cause: err,
  });
}
