# Macro Dashboard — domain schema (Epic 1.1)

This document describes the core domain objects that power the Macro Dashboard. The schema is mock-first: frontend and backend build against the same shapes before any live data source is integrated.

## Design principles

- Explicit, typed domain objects (TypeScript and Python mirrors).
- Small, readable, and stable field set.
- Numeric values stay numeric in transport; UI owns formatting.
- Dates are ISO 8601 strings.
- Optional fields are represented explicitly (`T | null` / `Optional[T]`).
- No coupling to any single vendor payload.
- Every data point carries source metadata and a user-facing explanation.
- UI strings are localized to Turkish, but the underlying schema can remain language-neutral.

## Entities

### `MacroIndicator`

A single macroeconomic data point shown on the dashboard.

| Field              | Type                     | Notes |
| ------------------ | ------------------------ | ----- |
| `id`               | `string`                 | Stable identifier. |
| `label`            | `string`                 | UI label, Turkish. |
| `labelEn`          | `string \| null`        | Optional English reference. |
| `region`           | `MacroRegion`            | `us` or `tr`. |
| `category`         | `MacroCategory`          | Yields, liquidity, risk, growth, inflation, FX, etc. |
| `value`            | `number`                 | Numeric transport value. |
| `unit`             | `string`                 | `%`, `index`, `bps`, `bn USD`, etc. |
| `change`           | `number \| null`        | Absolute change. |
| `changePercent`    | `number \| null`        | Percent change. |
| `trend`            | `TrendDirection`         | `up`, `down`, `flat`. |
| `updatedAt`        | `string` (ISO)           | Last refresh time. |
| `sourceName`       | `string`                 | FRED, FMP, TCMB, etc. |
| `sourceUrl`        | `string \| null`        | Source reference. |
| `descriptionTr`    | `string`                 | Nedir? |
| `interpretationTr` | `string`                 | Nasıl yorumlanır? |

### `MacroRegionSnapshot`

A regional bundle of indicators.

| Field        | Type                 |
| ------------ | ------------------- |
| `region`     | `MacroRegion`       |
| `asOf`       | `string` (ISO)      |
| `indicators` | `MacroIndicator[]`  |

### `YieldCurveSnapshot`

Used for the US yield curve view and rate-spread cards.

| Field           | Type                |
| --------------- | ------------------- |
| `country`       | `string`            |
| `tenYearYield`   | `number`            |
| `twoYearYield`   | `number`            |
| `spread`        | `number`            |
| `slopeTrend`    | `TrendDirection`    |
| `updatedAt`     | `string` (ISO)      |
| `sourceName`    | `string`            |
| `descriptionTr` | `string`            |
| `interpretationTr` | `string`         |

### `MacroSignalCard`

A synthesized signal card produced from multiple indicators.

| Field           | Type              |
| --------------- | ----------------- |
| `id`            | `string`          |
| `title`         | `string`          |
| `summary`       | `string`          |
| `severity`      | `InsightSeverity` |
| `confidence`    | `number`         |
| `sourceName`    | `string`          |
| `relatedIndicatorIds` | `string[]`   |

### `MacroTheme`

A thematic cluster such as rates, liquidity, inflation, or Turkey risk.

| Field        | Type             |
| ------------ | ---------------- |
| `id`         | `string`         |
| `name`       | `string`         |
| `description`| `string`         |
| `indicatorIds` | `string[]`     |

### `MacroEvent`

An upcoming or recent macro calendar event.

| Field        | Type               |
| ------------ | ------------------ |
| `id`         | `string`           |
| `eventName`  | `string`           |
| `region`     | `MacroRegion`      |
| `scheduledAt`| `string` (ISO)     |
| `expectedImpact` | `string`      |
| `actual`     | `number \| null`   |
| `consensus`  | `number \| null`   |
| `sourceName` | `string`           |

### `MacroAiSummary`

A top-level synthesized assessment.

| Field         | Type              |
| ------------- | ----------------- |
| `headline`    | `string`          |
| `body`        | `string`          |
| `stance`      | `MacroStance`     |
| `confidence`  | `number`          |
| `inputs`      | `string[]`        |
| `generatedAt` | `string` (ISO)    |

### US sentiment extension

| Field | Type | Notes |
| ----- | ---- | ----- |
| `fearGreedIndex` | `MacroIndicator` | US risk appetite metric. |
| `canSlimExposurePercent` | `MacroIndicator` | investors.com sourced exposure gauge. |

## Enumerations

- `MacroRegion`: `us`, `tr`
- `MacroCategory`: `rates`, `liquidity`, `risk`, `growth`, `inflation`, `fx`, `policy`, `credit`, `sentiment`
- `MacroStance`: `risk_on`, `risk_off`, `neutral`, `mixed`
- `TrendDirection`: `up`, `down`, `flat`
- `InsightSeverity`: `info`, `watch`, `warning`, `critical`

## Mock-data expectations

- Mock payloads mirror the exact field names and nesting of the real contract.
- Values are deterministic and realistic enough to drive UI development.
- Dates are ISO 8601 strings.
- Numbers remain numbers in transport — no pre-formatted strings.
- Optional fields are present with `null`, not omitted, so the schema is explicit.
- Every indicator includes source and explanatory text in Turkish.

## Files

- `shared/schemas/macro-dashboard.ts` — TypeScript source of truth.
- `shared/schemas/macro-dashboard.py` — Python mirror for FastAPI handlers.
- `shared/mocks/macro-dashboard.mock.json` — reference mock payload.

## Extensibility

The model is intentionally small. Planned expansion areas — additional macro themes, more regional snapshots, and richer AI synthesis — can attach new entities or extend enumerations without breaking the dashboard surfaces.
