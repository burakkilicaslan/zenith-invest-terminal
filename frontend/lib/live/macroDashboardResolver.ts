import type {
  IndicatorProvenance,
  MacroDashboard,
  MacroIndicator,
  MacroRegionSnapshot,
  ProviderMode,
  TrendDirection,
  DataSource,
} from "../types";
import { emptyMacroDashboard, mockMacroDashboard } from "../mocks/macro";
import {
  PROVIDER_POLICIES,
  readProviderKeys,
  type ProviderPolicy,
} from "./config";
import { cacheGet, cacheSet } from "./cache";
import { summarizeError } from "./errors";
import { ProviderStatusTracker } from "./status";
import { deriveAiSummary } from "./aiSummary";
import type { LiveObservation } from "./providers/common";
import { LIVE_BINDINGS, PROVIDER_LABELS, type LiveBinding } from "./macroDashboardBindings";
export interface GetMacroDashboardOptions {
  state?: "loading" | "empty" | "populated" | "error";
}
export async function getMacroDashboard(
  options: GetMacroDashboardOptions = {},
): Promise<MacroDashboard> {
  if (options.state === "empty") {
    return { ...emptyMacroDashboard, mode: "mock", providerStatus: [] };
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
      tracker.register(binding.secondary.code, PROVIDER_LABELS[binding.secondary.code]);
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
        resolved.push(attachProvenance(indicator, { mode: "mock", fetchedAt: indicator.updatedAt, providerCode: null, fallbackReason: "canlı kaynak eşlemesi yok" }));
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
  const mode: ProviderMode | "mixed" = liveCount > 0 && nonLiveCount === 0 ? "live" : liveCount > 0 && nonLiveCount > 0 ? "mixed" : providerStatus.some((p) => p.mode === "cached") ? "cached" : "mock";
  const aiSummary = deriveAiSummary(regions, mockMacroDashboard.aiSummary, mode);
  return {
    ...mockMacroDashboard,
    mode,
    source: mode === "mock" ? "mock" : mode === "live" ? "canlı" : "kısmen canlı",
    regions,
    providerStatus,
    aiSummary,
  };
}
async function resolveIndicator(
  indicator: MacroIndicator,
  binding: LiveBinding,
  keys: ReturnType<typeof readProviderKeys>,
  tracker: ProviderStatusTracker,
): Promise<MacroIndicator> {
  const primaryPolicy = PROVIDER_POLICIES[binding.primary];
  const freshCache = cacheGet<LiveObservation>(binding.primaryCacheKey, primaryPolicy.cacheTtlMs, primaryPolicy.staleTtlMs);
  if (freshCache && freshCache.fresh) {
    tracker.recordCacheHit(binding.primary, new Date(freshCache.storedAt).toISOString());
    return mergeObservation(indicator, binding.transform ? binding.transform(freshCache.value) : freshCache.value, { mode: "live", providerCode: binding.primary, fallbackReason: null }, binding.source);
  }
  const primaryKey = binding.usesApiKey === false ? null : keys[binding.primary];
  if (binding.usesApiKey === false || primaryKey) {
    try {
      const raw = await binding.fetchPrimary(primaryKey ?? undefined);
      const observation = binding.transform ? binding.transform(raw) : raw;
      cacheSet(binding.primaryCacheKey, raw);
      tracker.recordSuccess(binding.primary, observation.fetchedAt);
      return mergeObservation(indicator, observation, { mode: "live", providerCode: binding.primary, fallbackReason: null }, binding.source);
    } catch (err) {
      tracker.recordFailure(binding.primary, err);
    }
  } else {
    tracker.recordFailure(binding.primary, new Error("API anahtarı yok"));
  }
  if (binding.secondary) {
    const secondaryKey = binding.secondary.usesApiKey === false ? null : keys[binding.secondary.code];
    const secondaryPolicy = PROVIDER_POLICIES[binding.secondary.code];
    const freshSecondary = cacheGet<LiveObservation>(binding.secondary.cacheKey, secondaryPolicy.cacheTtlMs, secondaryPolicy.staleTtlMs);
    if (freshSecondary && freshSecondary.fresh) {
      tracker.recordCacheHit(binding.secondary.code, new Date(freshSecondary.storedAt).toISOString());
      return mergeObservation(indicator, freshSecondary.value, { mode: "live", providerCode: binding.secondary.code, fallbackReason: null }, binding.secondary.source);
    }
    if (secondaryKey) {
      try {
        const raw = await binding.secondary.fetch(secondaryKey ?? undefined);
        cacheSet(binding.secondary.cacheKey, raw);
        tracker.recordSuccess(binding.secondary.code, raw.fetchedAt);
        return mergeObservation(indicator, raw, { mode: "live", providerCode: binding.secondary.code, fallbackReason: null }, binding.secondary.source);
      } catch (err) {
        tracker.recordFailure(binding.secondary.code, err);
      }
    } else {
      tracker.recordFailure(binding.secondary.code, new Error("API anahtarı yok"));
    }
    const staleSecondary = cacheGet<LiveObservation>(binding.secondary.cacheKey, secondaryPolicy.cacheTtlMs, secondaryPolicy.staleTtlMs);
    if (staleSecondary) {
      return mergeObservation(indicator, staleSecondary.value, { mode: "cached", providerCode: binding.secondary.code, fallbackReason: `önbellekten (${humanAge(staleSecondary.ageMs)})` }, binding.secondary.source);
    }
  }
  const stalePrimary = cacheGet<LiveObservation>(binding.primaryCacheKey, primaryPolicy.cacheTtlMs, primaryPolicy.staleTtlMs);
  if (stalePrimary) {
    return mergeObservation(indicator, binding.transform ? binding.transform(stalePrimary.value) : stalePrimary.value, { mode: "cached", providerCode: binding.primary, fallbackReason: `önbellekten (${humanAge(stalePrimary.ageMs)})` }, binding.source);
  }
  return attachProvenance(indicator, { mode: "mock", fetchedAt: indicator.updatedAt, providerCode: null, fallbackReason: summarizeLastFailure(tracker, binding) });
}
function mergeObservation(
  base: MacroIndicator,
  observation: LiveObservation,
  provenance: Pick<IndicatorProvenance, "mode" | "providerCode" | "fallbackReason">,
  source?: DataSource,
): MacroIndicator {
  const previous = observation.previousValue;
  const change = previous !== null && previous !== undefined ? observation.value - previous : 0;
  const changePercent = previous !== null && previous !== undefined && previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;
  const trend: TrendDirection = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const history = observation.history.length > 0 ? observation.history : base.history;
  return {
    ...base,
    value: observation.value,
    change,
    changePercent,
    trend,
    updatedAt: observation.observedAt,
    history,
    source: source ?? base.source,
    provenance: { mode: provenance.mode, fetchedAt: observation.fetchedAt, providerCode: provenance.providerCode, fallbackReason: provenance.fallbackReason ?? null },
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
      change: point.change !== null && point.change !== undefined ? point.change * factor : point.change ?? null,
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
function summarizeLastFailure(tracker: ProviderStatusTracker, binding: LiveBinding): string {
  const statuses = tracker.snapshot();
  const primary = statuses.find((s) => s.code === binding.primary);
  if (primary?.lastError) {
    return `${primary.code}: ${primary.lastError} — mock değere döndü`;
  }
  return "sağlayıcı yanıtlamadı — mock değere döndü";
}
export const __internal = { LIVE_BINDINGS, mergeObservation, scaleObservation };
export type { ProviderPolicy };
