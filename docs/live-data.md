# Macro Dashboard — live-data integration (Epic 1, Issue #20)

Epic 1 ships mock-first: every macro indicator is defined in
`frontend/lib/mocks/macro.ts` with deterministic values so the
dashboard renders the full UX without any upstream dependency.

Issue #20 layers a **live provider** layer behind the same contract so
mapped indicators can resolve from FRED, FMP, Polygon, and TCMB while
preserving the Turkish product language, the macro-only surface, and
the mock fallback.

## Feature flag

| Variable            | Purpose                                                     |
| ------------------- | ----------------------------------------------------------- |
| `ZENITH_LIVE_DATA`  | Opt-in flag. Unset / `false` → dashboard renders from mock. |
| `FRED_API_KEY`      | FRED (fred.stlouisfed.org). Primary for US rates + VIX.     |
| `FMP_API_KEY`       | Financial Modeling Prep. Secondary for US Treasury tenors.  |
| `POLYGON_API_KEY`   | Polygon.io. Secondary for VIX daily aggregates.             |
| `TCMB_EVDS_API_KEY` | TCMB EVDS key. Primary for Turkey policy rate / CPI / FX.   |

With the flag off the code path is identical to the pre-#20 mock
render. Missing individual keys only degrade the affected provider;
the rest of the dashboard continues to resolve live.

## Indicator mapping

| Indicator id           | Primary                           | Secondary                     | Fallback |
| ---------------------- | --------------------------------- | ----------------------------- | -------- |
| `us-10y`               | FRED `DGS10`                      | FMP `/v4/treasury` `year10`   | mock     |
| `us-2y`                | FRED `DGS2`                       | FMP `/v4/treasury` `year2`    | mock     |
| `us-10y-2y`            | FRED `T10Y2Y`                     | —                             | mock     |
| `us-vix`               | FRED `VIXCLS`                     | Polygon `I:VIX` daily aggs    | mock     |
| `us-fed-bs`            | FRED `WALCL` (scaled to USD trn)  | —                             | mock     |
| `us-fear-greed`        | mock only (no public API)         | —                             | mock     |
| `us-canslim-exposure`  | mock only (no public API)         | —                             | mock     |
| `tr-policy-rate`       | TCMB EVDS `TP.APIFON1` (daily)    | —                             | mock     |
| `tr-tcmb-reserves`     | TCMB EVDS `TP.AB.B2` (weekly)     | —                             | mock     |
| `tr-cpi-yoy`           | TCMB EVDS `TP.FG.J0` (monthly)    | —                             | mock     |
| `tr-5y-cds`            | mock only (no free public API)    | —                             | mock     |

Indicators with no upstream mapping keep the mock value and render
with a `mock` mode chip so reviewers can still audit the attribution.

## Resolution order per indicator

The orchestrator walks the following chain and stops at the first
source that returns a validated observation:

1. **Fresh in-memory cache** for the primary provider (within
   `cacheTtlMs`).
2. **Primary provider fetch** (`providerFetch` → JSON parse →
   adapter-specific validation).
3. **Fresh in-memory cache** for the secondary provider.
4. **Secondary provider fetch**.
5. **Stale in-memory cache** for the secondary provider (within
   `staleTtlMs`, flagged as `cached`).
6. **Stale in-memory cache** for the primary provider.
7. **Deterministic mock fixture** (flagged as `mock`).

Every branch records the outcome on a `ProviderStatusTracker` which
feeds the per-provider chips in the dashboard header.

## Provider policies

Policies live in `frontend/lib/live/config.ts`:

| Provider | Timeout | Max retries | Base back-off | Fresh TTL | Stale TTL |
| -------- | ------- | ----------- | ------------- | --------- | --------- |
| FRED     | 4 s     | 2           | 250 ms        | 10 m      | 6 h       |
| FMP      | 4 s     | 2           | 250 ms        | 10 m      | 6 h       |
| Polygon  | 3 s     | 2           | 250 ms        | 10 m      | 6 h       |
| TCMB     | 6 s     | 2           | 250 ms        | 30 m      | 6 h       |

Rate-limit responses (HTTP 429) honor `Retry-After`; retries use
exponential back-off, capped by `maxRetries`.

## Validation

Adapters only emit `LiveObservation` values that pass:

- numeric `value` (FRED/FMP sentinel `"."` is rejected),
- ISO-8601 `observedAt`,
- non-empty `history` (values and timestamps parsed).

`ProviderValidationError` is thrown on any failure and surfaces on
the provider's status chip as "hatalı yanıt".

## Caching

In-memory, module-scoped, TTL-keyed (`frontend/lib/live/cache.ts`).
The cache persists across renders in the same Node worker. No
network or disk dependency. Cold-start workers trigger a fresh fetch
or fall back to mock if the fetch itself fails.

## UI surfaces

- Header renders a `ProviderStatusBar` with an overall mode pill
  (`Canlı veri` / `Kısmen canlı` / `Önbellek` / `Mock veri`) and one
  chip per provider. Tooltips carry the last-success timestamp and
  last-failure reason.
- Each KPI card's `FreshnessBadge` reads `indicator.provenance.mode`
  and recolors the status dot + adds a suffix chip (`önbellek` or
  `mock`) when the observation is not live.
- The Turkish `nedir` / `nasıl yorumlanır` copy, the deep-link
  attribution, and the AI investability summary are unchanged.

## Local development

No changes — leave `ZENITH_LIVE_DATA` unset and the dashboard behaves
exactly like the mock-first Epic 1.3 skeleton.
