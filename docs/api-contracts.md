# Macro Dashboard — API contracts (Epic 1.2)

This document pins the API boundary between the Next.js frontend and
the FastAPI backend for the Macro Dashboard. The boundary is
**mock-first** and **contract-driven**: backend handlers may return
fixtures until real data sources are wired up, and the frontend never
depends on handler internals — only on the shapes documented here.

## Endpoints

| Method | Path                               | Response                   |
| ------ | ---------------------------------- | -------------------------- |
| GET    | `/api/dashboard/summary`           | `DashboardSummaryResponse` |
| GET    | `/api/dashboard/positions`         | `PositionsResponse`        |
| GET    | `/api/dashboard/market-snapshot`   | `MarketSnapshotResponse`   |
| GET    | `/api/dashboard/insights`          | `InsightsResponse`         |
| GET    | `/api/dashboard/activity`          | `ActivityResponse`         |

All endpoints are GET, idempotent, and have no required request body.
List endpoints (`positions`, `insights`, `activity`) accept optional
`page` and `pageSize` query parameters; defaults are `page=1`,
`pageSize=25`.

## Envelope

Every successful response uses the same envelope:

```json
{
  "data": { "...": "domain payload" },
  "meta": {
    "requestId": "string",
    "generatedAt": "ISO 8601",
    "source": "mock" | "live"
  }
}
```

List endpoints embed a `pagination` block inside `meta`:

```json
{
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 42,
    "hasNextPage": true
  }
}
```

### Error shape

All error responses use a single, consistent shape so the frontend can
handle them uniformly:

```json
{
  "error": {
    "code": "UPSTREAM_UNAVAILABLE",
    "message": "Human-readable explanation.",
    "details": { "retryAfterSeconds": 30 }
  },
  "meta": {
    "requestId": "string",
    "generatedAt": "ISO 8601"
  }
}
```

## Data rules

- Dates are ISO 8601 strings.
- Currency and percentage values are **numeric** (not pre-formatted
  strings). UI owns formatting.
- Optional fields are present with `null`, not omitted.
- Enumerations follow the domain schema (Epic 1.1):
  `AssetClass`, `TrendDirection`, `InsightSeverity`, `InsightCategory`,
  `ActivityType`.

## Frontend consumption

The frontend consumes the API through a **typed client layer** that
maps endpoint paths to response types. The shared definition lives at
`shared/api/contracts.ts` (`DashboardResponseMap`). A thin client
function can infer its return type from the endpoint constant, keeping
the contract as the single source of truth.

## Mock fixtures

Each endpoint has at least one mock fixture. Fixtures are named by
endpoint and state so they can be swapped for UI state testing:

| Fixture                                       | Purpose                         |
| --------------------------------------------- | ------------------------------- |
| `shared/api/mocks/summary.populated.json`     | Populated summary response      |
| `shared/api/mocks/positions.populated.json`   | Populated positions response    |
| `shared/api/mocks/market-snapshot.populated.json` | Populated market snapshot   |
| `shared/api/mocks/insights.populated.json`    | Populated insights response     |
| `shared/api/mocks/activity.populated.json`    | Populated activity response     |
| `shared/api/mocks/empty.json`                 | Shared empty-list envelope      |
| `shared/api/mocks/error.json`                 | Shared error envelope           |

Supported UI states per endpoint: **empty**, **loading**, **populated**,
**error**. `loading` is a UI-side state, not a payload — the absence of
a resolved fixture models it naturally.

## Versioning

The contract is intentionally small. If a breaking change is required
later, prefix the endpoint with a version segment (for example,
`/api/v2/dashboard/summary`) rather than mutating an existing path.

## Files

- `shared/api/contracts.ts` — TypeScript source of truth.
- `shared/api/contracts.py` — Python mirror for FastAPI handlers.
- `shared/api/mocks/` — fixture payloads per endpoint and state.
