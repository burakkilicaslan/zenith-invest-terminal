/**
 * Tiny in-memory TTL cache for live-data responses.
 *
 * The cache lives in module scope so successive server-side renders
 * in the same Node process reuse fetched values without hammering
 * upstream providers. Values past `ttlMs` are considered fresh,
 * values past `staleTtlMs` are discarded entirely.
 *
 * The cache is intentionally process-local; no Redis, no disk. In
 * production this is sufficient because Next.js hosts keep workers
 * warm long enough for typical dashboard sessions, and the fallback
 * to mock ensures correctness even on a cold start.
 */

export interface CacheEntry<T> {
  value: T;
  storedAt: number;
}

export interface CacheLookup<T> {
  value: T;
  storedAt: number;
  ageMs: number;
  fresh: boolean;
  stale: boolean;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheSet<T>(key: string, value: T): void {
  store.set(key, { value, storedAt: Date.now() });
}

export function cacheGet<T>(
  key: string,
  ttlMs: number,
  staleTtlMs: number,
): CacheLookup<T> | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  const ageMs = Date.now() - entry.storedAt;
  if (ageMs > staleTtlMs) {
    store.delete(key);
    return null;
  }
  return {
    value: entry.value,
    storedAt: entry.storedAt,
    ageMs,
    fresh: ageMs <= ttlMs,
    stale: ageMs > ttlMs,
  };
}

/**
 * Visible to tests so they can start from a clean slate. Not used in
 * request paths.
 */
export function cacheReset(): void {
  store.clear();
}
