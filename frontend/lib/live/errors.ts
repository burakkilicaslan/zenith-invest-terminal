/**
 * Typed error surface for live-data providers.
 *
 * Every provider adapter must either return a validated observation
 * or throw one of the errors defined here. The orchestration layer
 * switches on the concrete class to decide whether to retry, serve
 * from cache, or fall back to the mock fixture.
 */

export type ProviderErrorCode =
  | "upstream_unavailable"
  | "timeout"
  | "rate_limited"
  | "malformed_response"
  | "missing_key"
  | "unknown";

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly provider: string;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    provider: string,
    code: ProviderErrorCode,
    message: string,
    options: { status?: number; retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.code = code;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, timeoutMs: number, cause?: unknown) {
    super(
      provider,
      "timeout",
      `${provider} request exceeded ${timeoutMs}ms timeout`,
      { cause },
    );
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(provider: string, retryAfterMs?: number) {
    super(provider, "rate_limited", `${provider} rate limit exceeded`, {
      status: 429,
      retryAfterMs,
    });
    this.name = "ProviderRateLimitError";
  }
}

export class ProviderValidationError extends ProviderError {
  constructor(provider: string, detail: string) {
    super(provider, "malformed_response", `${provider}: ${detail}`);
    this.name = "ProviderValidationError";
  }
}

export class ProviderMissingKeyError extends ProviderError {
  constructor(provider: string) {
    super(provider, "missing_key", `${provider} API key is not configured`);
    this.name = "ProviderMissingKeyError";
  }
}

/**
 * Normalize a short reason string for the UI (e.g. to put on a
 * provider-status chip).
 */
export function summarizeError(err: unknown): string {
  if (err instanceof ProviderError) {
    switch (err.code) {
      case "timeout":
        return "zaman aşımı";
      case "rate_limited":
        return "hız sınırı";
      case "malformed_response":
        return "hatalı yanıt";
      case "missing_key":
        return "API anahtarı yok";
      case "upstream_unavailable":
        return "sağlayıcı erişilemez";
      default:
        return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  return "bilinmeyen hata";
}
