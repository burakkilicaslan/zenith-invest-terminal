/**
 * Orchestration layer that turns the mock Epic 1 macro dashboard
 * into a live-data-aware payload.
 *
 * For every indicator that has a live-source mapping, the resolver
 * attempts (in order):
 *   1. A fresh in-memory cache hit (within `cacheTtlMs`).
 *   2. An upstream fetch via the provider adapter.
 *   3. A stale in-memory cache hit (within `staleTtlMs`).
 *   4. The deterministic mock fixture.
 *
 * The orchestrator never throws: a single provider outage downgrades
 * the affected indicator to `cached` or `mock` but the rest of the
 * dashboard continues to render live.
 */

import type {
  IndicatorProvenance,
  MacroDashboard,
  MacroIndicator,
  MacroRegionSnapshot,
  ProviderMode,
  TrendDirection,
} from "../types";
import { emptyMacroDashboard, mockMacroDashboard } from "../mocks/macro";
import {
  PROVIDER_POLICIES,
  isLiveDataEnabled,
  readProviderKeys,
  type ProviderPolicy,
} from "./config";
import { cacheGet, cacheSet } from "./cache";
import { summarizeError } from "./errors";
import { ProviderStatusTracker } from "./status";
import {
  FRED_SERIES,
  fetchFredSeries,
  type FredSeriesId,
} from "./providers/fred";
import { fetchFmpTreasury, type FmpTreasuryTenor } from "./providers/fmp";
import { fetchPolygonIndexAgg } from "./providers/polygon";
import { TCMB_SERIES, fetchTcmbSeries, type TcmbSeriesId } from "./providers/tcmb";
import type { LiveObservation } from "./providers/common";

type LiveFetcher = (apiKey: string) => Promise<LiveObservation>;

interface LiveBinding {
  /** Primary provider code for the indicator. */
  primary: "FRED" | "FMP" | "Polygon" | "TCMB";
  /** Stable cache key for the primary source. */
  primaryCacheKey: string;
  /** Executes the primary fetch. */
  fetchPrimary: LiveFetcher;
  /** Optional secondary provider chain tried after the primary fails. */
  secondary?: {
    code: "FRED" | "FMP" | "Polygon" | "TCMB";
    cacheKey: string;
    fetch: LiveFetcher;
  };
  /**
   * Optional unit-adjustment applied to the upstream value before it
   * is merged into the indicator (e.g. FRED returns Fed balance sheet
   * in millions of USD; the UI wants trillions).
   */
  transform?: (obs: LiveObservation) => LiveObservation;
}

const LIVE_BINDINGS: Record<string, LiveBinding> = {
  "us-10y": {
    primary: "FRED",
    primaryCacheKey: "FRED:DGS10",
    fetchPrimary: (apiKey) =>
      fetchFredSeries({ apiKey }, { seriesId: FRED_SERIES.US_10Y }),
    secondary: {
      code: "FMP",
      cacheKey: "FMP:treasury:year10",
      fetch: (apiKey) => fetchFmpTreasury({ apiKey }, { tenor: "year10" }),
    },
  },
  "us-2y": {
    primary: "FRED",
    primaryCacheKey: "FRED:DGS2",
    fetchPrimary: (apiKey) =>
      fetchFredSeries({ apiKey }, { seriesId: FRED_SERIES.US_2Y }),
    secondary: {
      code: "FMP",
      cacheKey: "FMP:treasury:year2",
      fetch: (apiKey) => fetchFmpTreasury({ apiKey }, { tenor: "year2" }),
    },
  },
  "us-10y-2y": {
    primary: "FRED",
    primaryCacheKey: "FRED:T10Y2Y",
    fetchPrimary: (apiKey) =>
      fetchFredSeries(
        { apiKey },
        { seriesId: FRED_SERIES.US_10Y_2Y_SPREAD },
      ),
  },
  "us-vix": {
    primary: "FRED",
    primaryCacheKey: "FRED:VIXCLS",
    fetchPrimary: (apiKey) =>
      fetchFredSeries({ apiKey }, { seriesId: FRED_SERIES.US_VIX }),
    secondary: {
      code: "Polygon",
      cacheKey: "Polygon:I:VIX",
      fetch: (apiKey) =>
        fetchPolygonIndexAgg({ apiKey }, { ticker: "I:VIX" }),
    },
  },
  "us-fed-bs": {
    primary: "FRED",
    primaryCacheKey: "FRED:WALCL",
    fetchPrimary: (apiKey) =>
      fetchFredSeries(
        { apiKey },
        { seriesId: FRED_SERIES.US_FED_BALANCE_SHEET },
      ),
    // FRED publishes WALCL in millions of USD; the dashboard shows
    // trillions. Scale the value + history before merging.
    transform: (obs) => scaleObservation(obs, 1 / 1_000_000),
  },
  "tr-policy-rate": {
    primary: "TCMB",
    primaryCacheKey: `TCMB:${TCMB_SERIES.POLICY_RATE}`,
    fetchPrimary: (apiKey) =>
      fetchTcmbSeries({ apiKey }, { seriesId: TCMB_SERIES.POLICY_RATE }),
  },
  "tr-tcmb-reserves": {
    primary: "TCMB",
    primaryCacheKey: `TCMB:${TCMB_SERIES.TCMB_RESERVES}`,
    fetchPrimary: (apiKey) =>
      fetchTcmbSeries(
        { apiKey },
        { seriesId: TCMB_SERIES.TCMB_RESERVES, frequency: 4 },
      ),
  },
  "tr-cpi-yoy": {
    primary: "TCMB",
    primaryCacheKey: `TCMB:${TCMB_SERIES.CPI_YOY}`,
    fetchPrimary: (apiKey) =>
      fetchTcmbSeries(
        { apiKey },
        { seriesId: TCMB_SERIES.CPI_YOY, frequency: 3 },
      ),
  },
};

const PROVIDER_LABELS: Record<LiveBinding["primary"], string> = {
  FRED: "Federal Reserve Economic Data",
  FMP: "Financial Modeling Prep",
  Polygon: "Polygon.io",
  TCMB: "Türkiye Cumhuriyet Merkez Bankası (EVDS)",
};

export interface GetMacroDashboardOptions {
  /** UI state — `empty` bypasses live fetches and returns the empty fixture. */
  state?: "loading" | "empty" | "populated" | "error";
}

/**
 * Public entry point.
 *
 * Always returns a MacroDashboard. Never throws.
 */
export async function getMacroDashboard(
  options: GetMacroDashboardOptions = {},
): Promise<MacroDashboard> {
  if (options.state === "empty") {
    return { ...emptyMacroDashboard, mode: "mock", providerStatus: [] };
  }
  if (!isLiveDataEnabled()) {
    return decorateMockDashboard();
  }
  return resolveLiveDashboard();
}

function decorateMockDashboard(): MacroDashboard {
  const fetchedAt = new Date().toISOString();
  const regions = mockMacroDashboard.regions.map<MacroRegionSnapshot>((snapshot) => ({
    ...snapshot,
    indicators: snapshot.indicators.map((indicator) =>
      attachProvenance(indicator, {
        mode: "mock",
        fetchedAt,
        providerCode: null,
        fallbackReason: "canlı veri devre dışı",
      }),
    ),
  }));
  return {
    ...mockMacroDashboard,
    mode: "mock",
    regions,
    providerStatus: [],
  };
}

async function resolveLiveDashboard(): Promise<MacroDashboard> {
  const keys = readProviderKeys();
  const tracker = new ProviderStatusTracker();
  for (const binding of Object.values(LIVE_BINDINGS)) {
    tracker.register(binding.primary, PROVIDER_LABELS[binding.primary]);
    if (binding.secondary) {
      tracker.register(
        binding.secondary.code,
        PROVIDER_LABELS[binding.secondary.code],
      );
    }
  }

  const regions: MacroRegionSnapshot[] = [];
  let liveCount = 0;
  let nonLiveCount = 0;

  for (const region of mockMacroDashboard.regions) {
    const resolved: MacroIndicator[] = [];
    for (const indicator of region.indicators) {
      const binding = LIVE_BINDINGS[indicator.id];
      if (!binding) {
        resolved.push(
          attachProvenance(indicator, {
            mode: "mock",
            fetchedAt: indicator.updatedAt,
            providerCode: null,
            fallbackReason: "canlı kaynak eşlemesi yok",
          }),
        );
        nonLiveCount += 1;
        continue;
      }
      const next = await resolveIndicator(indicator, binding, keys, tracker);
      resolved.push(next);
      if (next.provenance?.mode === "live") {
        liveCount += 1;
      } else {
        nonLiveCount += 1;
      }
    }
    regions.push({ ...region, indicators: resolved });
  }

  const providerStatus = tracker.snapshot();
  const mode: ProviderMode | "mixed" =
    liveCount > 0 && nonLiveCount === 0
      ? "live"
      : liveCount > 0 && nonLiveCount > 0
        ? "mixed"
        : providerStatus.some((p) => p.mode === "cached")
          ? "cached"
          : "mock";

  return {
    ...mockMacroDashboard,
    mode,
    source: mode === "mock" ? "mock" : mode === "live" ? "canlı" : "kısmen canlı",
    regions,
    providerStatus,
  };
}

async function resolveIndicator(
  indicator: MacroIndicator,
  binding: LiveBinding,
  keys: ReturnType<typeof readProviderKeys>,
  tracker: ProviderStatusTracker,
): Promise<MacroIndicator> {
  const primaryPolicy = PROVIDER_POLICIES[binding.primary];
  // Fresh cache first — avoids a round trip when a previous render
  // already fetched the same series.
  const freshCache = cacheGet<LiveObservation>(
    binding.primaryCacheKey,
    primaryPolicy.cacheTtlMs,
    primaryPolicy.staleTtlMs,
  );
  if (freshCache && freshCache.fresh) {
    tracker.recordCacheHit(
      binding.primary,
      new Date(freshCache.storedAt).toISOString(),
    );
    return mergeObservation(indicator, binding.transform ? binding.transform(freshCache.value) : freshCache.value, {
      mode: "live",
      providerCode: binding.primary,
    });
  }

  const primaryKey = keys[binding.primary];
  if (primaryKey) {
    try {
      const raw = await binding.fetchPrimary(primaryKey);
      const observation = binding.transform ? binding.transform(raw) : raw;
      cacheSet(binding.primaryCacheKey, raw);
      tracker.recordSuccess(binding.primary, observation.fetchedAt);
      return mergeObservation(indicator, observation, {
        mode: "live",
        providerCode: binding.primary,
      });
    } catch (err) {
      tracker.recordFailure(binding.primary, err);
    }
  } else {
    tracker.recordFailure(
      binding.primary,
      new Error("API anahtarı yok"),
    );
  }

  // Secondary provider attempt, if mapped.
  if (binding.secondary) {
    const secondaryKey = keys[binding.secondary.code];
    const secondaryPolicy = PROVIDER_POLICIES[binding.secondary.code];
    const freshSecondary = cacheGet<LiveObservation>(
      binding.secondary.cacheKey,
      secondaryPolicy.cacheTtlMs,
      secondaryPolicy.staleTtlMs,
    );
    if (freshSecondary && freshSecondary.fresh) {
      tracker.recordCacheHit(
        binding.secondary.code,
        new Date(freshSecondary.storedAt).toISOString(),
      );
      return mergeObservation(indicator, freshSecondary.value, {
        mode: "live",
        providerCode: binding.secondary.code,
      });
    }
    if (secondaryKey) {
      try {
        const raw = await binding.secondary.fetch(secondaryKey);
        cacheSet(binding.secondary.cacheKey, raw);
        tracker.recordSuccess(binding.secondary.code, raw.fetchedAt);
        return mergeObservation(indicator, raw, {
          mode: "live",
          providerCode: binding.secondary.code,
        });
      } catch (err) {
        tracker.recordFailure(binding.secondary.code, err);
      }
    } else {
      tracker.recordFailure(
        binding.secondary.code,
        new Error("API anahtarı yok"),
      );
    }
    // Stale secondary cache fallback.
    const staleSecondary = cacheGet<LiveObservation>(
      binding.secondary.cacheKey,
      secondaryPolicy.cacheTtlMs,
      secondaryPolicy.staleTtlMs,
    );
    if (staleSecondary) {
      return mergeObservation(indicator, staleSecondary.value, {
        mode: "cached",
        providerCode: binding.secondary.code,
        fallbackReason: `önbellekten (${humanAge(staleSecondary.ageMs)})`,
      });
    }
  }

  // Stale primary cache fallback.
  const stalePrimary = cacheGet<LiveObservation>(
    binding.primaryCacheKey,
    primaryPolicy.cacheTtlMs,
    primaryPolicy.staleTtlMs,
  );
  if (stalePrimary) {
    return mergeObservation(
      indicator,
      binding.transform ? binding.transform(stalePrimary.value) : stalePrimary.value,
      {
        mode: "cached",
        providerCode: binding.primary,
        fallbackReason: `önbellekten (${humanAge(stalePrimary.ageMs)})`,
      },
    );
  }

  // Last resort: the deterministic mock value.
  return attachProvenance(indicator, {
    mode: "mock",
    fetchedAt: indicator.updatedAt,
    providerCode: null,
    fallbackReason: summarizeLastFailure(tracker, binding),
  });
}

function mergeObservation(
  base: MacroIndicator,
  observation: LiveObservation,
  provenance: Pick<IndicatorProvenance, "mode" | "providerCode" | "fallbackReason">,
): MacroIndicator {
  const previous = observation.previousValue;
  const change = previous !== null && previous !== undefined
    ? observation.value - previous
    : 0;
  const changePercent = previous !== null && previous !== undefined && previous !== 0
    ? (change / Math.abs(previous)) * 100
    : 0;
  const trend: TrendDirection =
    change > 0 ? "up" : change < 0 ? "down" : "flat";
  const history = observation.history.length > 0 ? observation.history : base.history;
  return {
    ...base,
    value: observation.value,
    change,
    changePercent,
    trend,
    updatedAt: observation.observedAt,
    history,
    provenance: {
      mode: provenance.mode,
      fetchedAt: observation.fetchedAt,
      providerCode: provenance.providerCode,
      fallbackReason: provenance.fallbackReason ?? null,
    },
  };
}

function attachProvenance(
  indicator: MacroIndicator,
  provenance: IndicatorProvenance,
): MacroIndicator {
  return { ...indicator, provenance };
}

function scaleObservation(obs: LiveObservation, factor: number): LiveObservation {
  return {
    ...obs,
    value: obs.value * factor,
    previousValue:
      obs.previousValue !== null && obs.previousValue !== undefined
        ? obs.previousValue * factor
        : obs.previousValue ?? null,
    history: obs.history.map((point) => ({
      ...point,
      value: point.value * factor,
      change: point.change !== null && point.change !== undefined
        ? point.change * factor
        : point.change ?? null,
    })),
  };
}

function humanAge(ageMs: number): string {
  const minutes = Math.round(ageMs / 60_000);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} sa`;
  const days = Math.round(hours / 24);
  return `${days} gün`;
}

function summarizeLastFailure(
  tracker: ProviderStatusTracker,
  binding: LiveBinding,
): string {
  const statuses = tracker.snapshot();
  const primary = statuses.find((s) => s.code === binding.primary);
  if (primary?.lastError) {
    return `${primary.code}: ${primary.lastError} — mock değere döndü`;
  }
  return "sağlayıcı yanıtlamadı — mock değere döndü";
}

// Expose internals for tests / debugging.
export const __internal = { LIVE_BINDINGS, mergeObservation, scaleObservation };
export type { ProviderPolicy };
