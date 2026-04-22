/**
 * Aggregates per-provider status across all indicator fetches so the
 * dashboard can render provider-health chips in the header.
 */

import type { ProviderMode, ProviderStatus } from "../types";
import { summarizeError } from "./errors";

interface Entry {
  code: string;
  label: string;
  successes: number;
  failures: number;
  cachedHits: number;
  lastSuccessAt: string | null;
  lastError: string | null;
}

export class ProviderStatusTracker {
  private readonly entries = new Map<string, Entry>();

  register(code: string, label: string): void {
    if (!this.entries.has(code)) {
      this.entries.set(code, {
        code,
        label,
        successes: 0,
        failures: 0,
        cachedHits: 0,
        lastSuccessAt: null,
        lastError: null,
      });
    }
  }

  recordSuccess(code: string, fetchedAt: string): void {
    const entry = this.entries.get(code);
    if (!entry) return;
    entry.successes += 1;
    entry.lastSuccessAt = fetchedAt;
  }

  recordCacheHit(code: string, storedAt: string): void {
    const entry = this.entries.get(code);
    if (!entry) return;
    entry.cachedHits += 1;
    if (!entry.lastSuccessAt || storedAt > entry.lastSuccessAt) {
      entry.lastSuccessAt = storedAt;
    }
  }

  recordFailure(code: string, err: unknown): void {
    const entry = this.entries.get(code);
    if (!entry) return;
    entry.failures += 1;
    entry.lastError = summarizeError(err);
  }

  snapshot(): ProviderStatus[] {
    const list: ProviderStatus[] = [];
    for (const entry of this.entries.values()) {
      // Skip providers that were registered but never exercised in
      // this resolution — e.g. a secondary fallback whose primary
      // succeeded on every indicator. Showing them as `mock` would
      // falsely imply the provider is unreachable when in reality it
      // simply was not needed, which is what made Vercel deployments
      // look like FMP/Polygon were broken whenever FRED resolved.
      if (
        entry.successes === 0 &&
        entry.cachedHits === 0 &&
        entry.failures === 0
      ) {
        continue;
      }
      const mode: ProviderMode =
        entry.successes > 0
          ? "live"
          : entry.cachedHits > 0
            ? "cached"
            : "mock";
      list.push({
        code: entry.code,
        label: entry.label,
        mode,
        lastSuccessAt: entry.lastSuccessAt,
        lastError: entry.failures > 0 ? entry.lastError : null,
      });
    }
    list.sort((a, b) => a.code.localeCompare(b.code));
    return list;
  }
}
