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
  /** Maximum retry attempts on top of the initial request. */
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
  Alternative: {
    ...DEFAULT_POLICY,
    timeoutMs: 3_000,
    cacheTtlMs: 24 * 60 * 60 * 1000,
    staleTtlMs: 48 * 60 * 60 * 1000,
  },
  Yahoo: {
    ...DEFAULT_POLICY,
    timeoutMs: 3_000,
    cacheTtlMs: 24 * 60 * 60 * 1000,
    staleTtlMs: 48 * 60 * 60 * 1000,
  },
};

/**
 * Live-mode toggle. Keep this a function (not a constant) so tests
 * and server restarts re-read the environment each call. Support both
 * the documented ZENITH_LIVE_DATA key and the legacy alias without
 * underscores so deployments keep working during migration.
 *
 * Env vars are read via static process.env.NAME accesses on purpose:
 * Next.js / webpack only wire up an env var into the serverless
 * bundle when it sees the literal name in the source. Dynamic
 * process.env[name] lookups are not statically analyzable and silently
 * return undefined on Vercel even when the variable is set in the
 * project settings, which is what kept the live-data toggle stuck in
 * mock mode.
 */
export function isLiveDataEnabled(): boolean {
  return (
    parseBooleanFlag(process.env.ZENITH_LIVE_DATA) ||
    parseBooleanFlag(process.env.ZENITHLIVEDATA)
  );
}

function parseBooleanFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw === null) return false;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return false;
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export interface ProviderKeyLookup {
  FRED: string | null;
  FMP: string | null;
  Polygon: string | null;
  TCMB: string | null;
  [key: string]: string | null;
}

export function readProviderKeys(): ProviderKeyLookup {
  return {
    FRED: normalizeKey(process.env.FRED_API_KEY),
    FMP: normalizeKey(process.env.FMP_API_KEY),
    Polygon: normalizeKey(process.env.POLYGON_API_KEY),
    TCMB: normalizeKey(process.env.TCMB_EVDS_API_KEY),
  };
}

function normalizeKey(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
