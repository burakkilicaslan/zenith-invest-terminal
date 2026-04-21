/**
 * Live-data configuration for Epic 1 macro providers.
 *
 * The provider layer is opt-in: when `ZENITH_LIVE_DATA` is unset or
 * falsy, the dashboard continues to render from the mock fixtures
 * exactly as before. When it is enabled and per-provider keys are
 * present, each mapped indicator is refreshed from its upstream
 * source with a cache + fallback behind it.
 *
 * Every provider ships with a conservative timeout + retry + TTL so
 * that a flaky upstream cannot delay the whole dashboard render.
 */

/** Per-provider fetch + cache policy. */
export interface ProviderPolicy {
  /** HTTP request timeout in milliseconds. */
  timeoutMs: number;
  /** Maximum retry attempts *on top of* the initial request. */
  maxRetries: number;
  /** Initial backoff delay, doubled per retry. */
  baseRetryDelayMs: number;
  /** TTL for successful responses in the in-memory cache. */
  cacheTtlMs: number;
  /** TTL after which even cached values are considered stale. */
  staleTtlMs: number;
}

const DEFAULT_POLICY: ProviderPolicy = {
  timeoutMs: 4_000,
  maxRetries: 2,
  baseRetryDelayMs: 250,
  cacheTtlMs: 10 * 60 * 1000,
  staleTtlMs: 6 * 60 * 60 * 1000,
};

export const PROVIDER_POLICIES: Record<string, ProviderPolicy> = {
  FRED: { ...DEFAULT_POLICY },
  FMP: { ...DEFAULT_POLICY },
  Polygon: { ...DEFAULT_POLICY, timeoutMs: 3_000 },
  TCMB: { ...DEFAULT_POLICY, timeoutMs: 6_000, cacheTtlMs: 30 * 60 * 1000 },
};

/**
 * Live-mode toggle. Keep this a function (not a constant) so tests
 * and server restarts re-read the environment each call.
 */
export function isLiveDataEnabled(): boolean {
  const flag = process.env.ZENITH_LIVE_DATA;
  if (!flag) return false;
  const normalized = flag.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export interface ProviderKeyLookup {
  FRED: string | null;
  FMP: string | null;
  Polygon: string | null;
  TCMB: string | null;
}

export function readProviderKeys(): ProviderKeyLookup {
  return {
    FRED: envOrNull("FRED_API_KEY"),
    FMP: envOrNull("FMP_API_KEY"),
    Polygon: envOrNull("POLYGON_API_KEY"),
    TCMB: envOrNull("TCMB_EVDS_API_KEY"),
  };
}

function envOrNull(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
