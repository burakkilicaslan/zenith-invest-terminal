/**
 * Shared HTTP helper for provider adapters.
 *
 * Every provider adapter uses `providerFetch` so that timeout,
 * retry, and status-based error translation are handled in exactly
 * one place. The function returns the parsed JSON payload (typed as
 * `unknown` — adapters are responsible for validation) or throws one
 * of the typed errors in `./errors`.
 */

import {
  ProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "./errors";
import type { ProviderPolicy } from "./config";

export interface ProviderFetchOptions {
  url: string;
  provider: string;
  policy: ProviderPolicy;
  headers?: Record<string, string>;
  /**
   * How to handle HTTP 3xx responses. Defaults to `"follow"` so
   * providers that emit ordinary redirects (CDN hops, trailing-slash
   * normalization) continue to work transparently. Use `"manual"` to
   * turn an unexpected redirect into a typed `ProviderError` — this
   * matters for providers like TCMB EVDS that reply to auth failures
   * with a 302 to an HTML portal instead of a proper 401/403.
   */
  redirect?: "follow" | "manual";
}

export async function providerFetch(
  options: ProviderFetchOptions,
): Promise<unknown> {
  const { url, provider, policy, headers, redirect = "follow" } = options;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= policy.maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), policy.timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          ...(headers ?? {}),
        },
        cache: "no-store",
        redirect,
      });
      if (response.status === 429) {
        const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
        throw new ProviderRateLimitError(provider, retryAfter);
      }
      if (response.status >= 500) {
        throw new ProviderError(
          provider,
          "upstream_unavailable",
          `${provider} returned HTTP ${response.status}`,
          { status: response.status },
        );
      }
      // `redirect: "manual"` yields either a standard 3xx response
      // (Node's undici) or an opaque-redirect response with status 0
      // (browser-ish fetch shims). Either way the caller did not opt
      // in to following the redirect, so surface it as an upstream
      // availability problem instead of trying to parse the redirect
      // target's body.
      if (
        redirect === "manual" &&
        ((response.status >= 300 && response.status < 400) ||
          (response.type === "opaqueredirect" && response.status === 0))
      ) {
        throw new ProviderError(
          provider,
          "upstream_unavailable",
          `${provider} returned unexpected redirect (HTTP ${response.status})`,
          { status: response.status },
        );
      }
      if (!response.ok) {
        throw new ProviderError(
          provider,
          "upstream_unavailable",
          `${provider} returned HTTP ${response.status}`,
          { status: response.status },
        );
      }
      const text = await response.text();
      if (!text) {
        throw new ProviderError(
          provider,
          "malformed_response",
          `${provider} returned empty body`,
        );
      }
      try {
        return JSON.parse(text) as unknown;
      } catch (err) {
        throw new ProviderError(
          provider,
          "malformed_response",
          `${provider} returned non-JSON body`,
          { cause: err },
        );
      }
    } catch (err) {
      lastError = err;
      if (
        err instanceof Error &&
        (err.name === "AbortError" || err.name === "TimeoutError")
      ) {
        lastError = new ProviderTimeoutError(provider, policy.timeoutMs, err);
      }
      if (!shouldRetry(lastError) || attempt === policy.maxRetries) {
        throw lastError;
      }
      const delay = backoffDelay(policy.baseRetryDelayMs, attempt, lastError);
      await sleep(delay);
      attempt += 1;
    } finally {
      clearTimeout(timer);
    }
  }

  // Unreachable; the loop always returns or throws.
  throw (
    lastError ??
    new ProviderError(provider, "unknown", `${provider}: retry loop exited`)
  );
}

function shouldRetry(err: unknown): boolean {
  if (err instanceof ProviderError) {
    return (
      err.code === "timeout" ||
      err.code === "upstream_unavailable" ||
      err.code === "rate_limited"
    );
  }
  return false;
}

function backoffDelay(
  base: number,
  attempt: number,
  err: unknown,
): number {
  if (err instanceof ProviderRateLimitError && err.retryAfterMs) {
    return err.retryAfterMs;
  }
  return base * Math.pow(2, attempt);
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return asSeconds * 1000;
  }
  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now());
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
