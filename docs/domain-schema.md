# Macro Dashboard — domain schema (Epic 1.1)

This document describes the core domain objects that power the Macro
Dashboard. The schema is mock-first: frontend and backend build against
the same shapes before any live data source is integrated.

## Design principles

- Explicit, typed domain objects (TypeScript and Python mirrors).
- Small, readable, and stable field set.
- Numeric values stay numeric in transport; UI owns formatting.
- Dates are ISO 8601 strings.
- Optional fields are represented explicitly (`T | null` / `Optional[T]`).
- No coupling to any single vendor payload.

## Entities

### `DashboardSummary`

Top-of-page portfolio snapshot for the dashboard header strip.

| Field                  | Type                 | Notes                         |
| ---------------------- | -------------------- | ----------------------------- |
| `dateRange`            | `DateRange`          | Reporting window, ISO 8601.   |
| `totalPortfolioValue`  | `number`             | Sum of all positions + cash.  |
| `dailyChange`          | `number`             | Absolute, unformatted.        |
| `dailyChangePercent`   | `number`             | Percent, not a string.        |
| `cashBalance`          | `number`             |                               |
| `investedBalance`      | `number`             |                               |
| `allocationOverview`   | `AllocationSlice[]`  | Summed allocation per class.  |

### `AssetPosition`

One row of the positions table.

| Field                  | Type          |
| ---------------------- | ------------- |
| `symbol`               | `string`      |
| `name`                 | `string`      |
| `assetClass`           | `AssetClass`  |
| `quantity`             | `number`      |
| `marketPrice`          | `number`      |
| `marketValue`          | `number`      |
| `costBasis`            | `number`      |
| `unrealizedPnL`        | `number`      |
| `unrealizedPnLPercent` | `number`      |
| `allocationPercent`    | `number`      |

### `MarketSnapshot`

One row of the market snapshot / trend panel.

| Field           | Type              |
| --------------- | ----------------- |
| `symbol`        | `string`          |
| `label`         | `string`          |
| `currentValue`  | `number`          |
| `change`        | `number`          |
| `changePercent` | `number`          |
| `trend`         | `TrendDirection`  |
| `updatedAt`     | `string` (ISO)    |

### `InsightCard`

One card in the insight / signal feed.

| Field        | Type                |
| ------------ | ------------------- |
| `id`         | `string`            |
| `title`      | `string`            |
| `summary`    | `string`            |
| `severity`   | `InsightSeverity`   |
| `category`   | `InsightCategory`   |
| `confidence` | `number` (0.0–1.0)  |
| `source`     | `string \| null`    |

### `ActivityItem`

One row of the activity timeline.

| Field           | Type              |
| --------------- | ----------------- |
| `id`            | `string`          |
| `timestamp`     | `string` (ISO)    |
| `type`          | `ActivityType`    |
| `title`         | `string`          |
| `description`   | `string`          |
| `relatedSymbol` | `string \| null`  |

### Enumerations

- `AssetClass`: `equity`, `fixed_income`, `cash`, `crypto`, `commodity`, `alternative`
- `TrendDirection`: `up`, `down`, `flat`
- `InsightSeverity`: `info`, `watch`, `warning`, `critical`
- `InsightCategory`: `macro`, `market`, `portfolio`, `signal`, `news`
- `ActivityType`: `trade`, `deposit`, `withdrawal`, `dividend`, `rebalance`, `system`

## Mock-data expectations

- Mock payloads mirror the exact field names and nesting of the real contract.
- Values are deterministic and realistic enough to drive UI development.
- Dates are ISO 8601 strings.
- Numbers remain numbers in transport — no pre-formatted strings.
- Optional fields are present with `null` (not omitted) so the schema is explicit.

A reference mock payload lives at `shared/mocks/dashboard.mock.json` and
covers the full `MacroDashboard` aggregate.

## Files

- `shared/schemas/dashboard.ts` — TypeScript source of truth.
- `shared/schemas/dashboard.py` — Python mirror for FastAPI handlers.
- `shared/mocks/dashboard.mock.json` — reference mock payload.

## Extensibility

The model is intentionally small. Planned expansion areas — additional
market factors, portfolio breakdowns, and signal streams — can attach
new entities or extend enumerations without breaking the existing
dashboard surfaces.
