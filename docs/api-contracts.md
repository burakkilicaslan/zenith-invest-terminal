# Macro Dashboard — API contracts (Epic 1.2)

This document pins the API boundary between the Next.js frontend and the FastAPI backend for the Macro Dashboard. The boundary is mock-first and contract-driven: backend handlers may return fixtures until real data sources are wired up, and the frontend never depends on handler internals — only on the shapes documented here.

## Endpoints

| Method | Path | Response |
| ------ | ---- | -------- |
| GET | `/api/macro/summary` | `MacroSummaryResponse` |
| GET | `/api/macro/indicators` | `MacroIndicatorsResponse` |
| GET | `/api/macro/yield-curve` | `YieldCurveResponse` |
| GET | `/api/macro/signals` | `MacroSignalsResponse` |
| GET | `/api/macro/events` | `MacroEventsResponse` |
| GET | `/api/macro/ai-summary` | `MacroAiSummaryResponse` |

All endpoints are GET, idempotent, and have no required request body.
List endpoints accept optional `region`, `theme`, `page`, and `pageSize` query parameters where applicable.

## Envelope

Every successful response uses the same envelope:

```json
{
  "data": { "...": "domain payload" },
  "meta": {
    "requestId": "string",
    "generatedAt": "ISO 8601",
    "source": "mock" | "live",
    "locale": "tr-TR"
  }
}
```

List endpoints embed a `pagination` block inside `meta`.

### Error shape

All error responses use a single, consistent shape so the frontend can handle them uniformly:

```json
{
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Human-readable explanation.",
    "details": { "retryAfterSeconds": 30 }
  },
  "meta": {
    "requestId": "string",
    "generatedAt": "ISO 8601",
    "locale": "tr-TR"
  }
}
```

## Data rules

- Dates are ISO 8601 strings.
- Currency, rate, and percentage values are numeric.
- Optional fields are present with `null`, not omitted.
- Every indicator contains `sourceName`, `sourceUrl`, `descriptionTr`, and `interpretationTr`.
- All user-facing content returned by the API must be Turkish by default.
- US-specific metrics such as Fear & Greed Index and CAN SLIM exposure are first-class indicators, not special cases.

## Source requirements

The backend must expose source metadata for each metric. Supported source families include:
- FRED
- FMP
- Federal Reserve
- U.S. Treasury
- TCMB
- investors.com
- Fear & Greed provider used by the product

## Frontend consumption

The frontend consumes the API through a typed client layer that maps endpoint paths to response types. The shared definition lives at `shared/api/contracts.ts` and should mirror the macro dashboard schema. A thin client function can infer its return type from the endpoint constant, keeping the contract as the single source of truth.

## Mock fixtures

Each endpoint has at least one mock fixture. Fixtures are named by endpoint and state so they can be swapped for UI state testing.

Supported UI states per endpoint: empty, loading, populated, error. loading is a UI-side state, not a payload — the absence of a resolved fixture models it naturally.

## AI summary contract

`/api/macro/ai-summary` returns a synthesized assessment that merges all macro data into one Turkish summary.
Required output fields:
- headline
- body
- stance
- confidence
- inputs
- generatedAt

## Versioning

If a breaking change is required later, prefix the endpoint with a version segment rather than mutating an existing path.

## Files

- `shared/api/contracts.ts` — TypeScript source of truth.
- `shared/api/contracts.py` — Python mirror for FastAPI handlers.
- `shared/api/mocks/` — fixture payloads per endpoint and state.
