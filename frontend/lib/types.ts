// Epic 1 — Macro Dashboard domain types.
//
// These shapes drive the macro strategy dashboard (US + Türkiye). The
// dashboard is mock-first: every surface reads typed fixtures and no
// live data source is wired in yet.
//
// Issue #18 enrichment:
// - Each indicator now carries source metadata (code / label / url),
//   a "what it is" (`nedir`) explanation and a "how to interpret"
//   (`nasıl yorumlanır`) guide.
// - A top-level AI summary surfaces an "is it an investable
//   environment?" assessment synthesized over the full macro set.
// - US sentiment metrics (Fear & Greed Index, investors.com CAN SLIM
//   % exposure) are modeled as first-class indicators.
//
// Equity/position/portfolio shapes are intentionally NOT defined here;
// they are preserved for Epic 2 in `shared/schemas/dashboard.ts`.

export type MacroRegion = "us" | "tr";

export type TrendDirection = "up" | "down" | "flat";

export type SignalSeverity = "info" | "watch" | "warning" | "critical";

export type MacroCategory =
  | "rates"
  | "curve"
  | "volatility"
  | "liquidity"
  | "credit"
  | "reserves"
  | "policy"
  | "fx"
  | "inflation"
  | "sentiment"
  | "breadth";

export type IndicatorUnit =
  | "percent"
  | "bps"
  | "index"
  | "usd_trillions"
  | "usd_billions"
  | "ratio"
  | "score";

export type EventImpact = "low" | "medium" | "high";

export type DashboardState = "loading" | "empty" | "populated" | "error";

/**
 * Resolution mode for a single indicator or the whole dashboard.
 *
 * - `live` — value came from a successful provider fetch in this build.
 * - `cached` — value came from an earlier provider fetch that is still
 *   within TTL but failed to refresh this cycle.
 * - `mock` — value came from the deterministic Epic 1 mock fixture
 *   because no provider key was configured, the provider was degraded,
 *   or the indicator has no live source mapped yet.
 */
export type ProviderMode = "live" | "cached" | "mock";

/**
 * Provider health / degradation state surfaced to the UI. This lets
 * the dashboard show "kısmen canlı" style chips when one provider is
 * down but the rest are serving live data.
 */
export interface ProviderStatus {
  /** Short provider code (e.g. "FRED", "FMP", "Polygon", "TCMB"). */
  code: string;
  /** Human-readable label (e.g. "Federal Reserve Economic Data"). */
  label: string;
  /** Current resolution mode for this provider. */
  mode: ProviderMode;
  /** ISO 8601 timestamp of the most recent successful fetch, if any. */
  lastSuccessAt: string | null;
  /** Short reason string when the provider is degraded. */
  lastError: string | null;
}

/**
 * Per-indicator provenance. Attached in addition to the upstream
 * `DataSource` so the UI can show whether *this* observation came
 * from a live fetch, a cached fetch, or the mock fixture.
 */
export interface IndicatorProvenance {
  mode: ProviderMode;
  /** ISO 8601 timestamp the value was fetched or generated. */
  fetchedAt: string;
  /** Provider code that serviced the fetch, or `null` for mock. */
  providerCode: string | null;
  /** Optional short reason when `mode` is `cached` or `mock`. */
  fallbackReason?: string | null;
}

/**
 * Investability verdict the top-level AI summary can emit. The UI
 * colors the verdict pill based on this value.
 */
export type InvestabilityVerdict =
  | "favorable"
  | "cautious"
  | "unfavorable"
  | "mixed";

export function isDashboardState(value: unknown): value is DashboardState {
  return (
    value === "loading" ||
    value === "empty" ||
    value === "populated" ||
    value === "error"
  );
}

export function isMacroRegion(value: unknown): value is MacroRegion {
  return value === "us" || value === "tr";
}

/**
 * Attribution for a data point or narrative. Surfaced prominently on
 * every card so reviewers always know what feed the value came from.
 */
export interface DataSource {
  /** Short code displayed on badges (e.g. "FRED", "FMP", "TCMB", "CNN"). */
  code: string;
  /** Human-friendly label (e.g. "Federal Reserve Economic Data"). */
  label: string;
  /** Optional deep link to the upstream series / page. */
  url?: string | null;
}

export interface MacroTimeSeriesPoint {
  /** ISO 8601 timestamp for the observation. */
  timestamp: string;
  value: number;
  /** Optional benchmark value at the same timestamp (e.g. long-run mean). */
  benchmark?: number | null;
  /** Optional period-over-period change (native indicator unit). */
  change?: number | null;
}

export interface MacroIndicator {
  id: string;
  /** Turkish display label (primary UI copy). */
  label: string;
  /** Optional English label preserved for tooltips / fallbacks. */
  labelEn?: string | null;
  region: MacroRegion;
  category: MacroCategory;
  /** Current observed value in the indicator's native unit. */
  value: number;
  unit: IndicatorUnit;
  /** Absolute change vs. prior observation (same unit as `value`). */
  change: number;
  /** Percent change vs. prior observation (e.g. `0.42` = +0.42%). */
  changePercent: number;
  trend: TrendDirection;
  /** ISO 8601 timestamp the `value` was observed at. */
  updatedAt: string;
  /** Structured attribution (code + friendly label + optional URL). */
  source: DataSource;
  /** Recent observations powering sparklines / trend charts. */
  history: MacroTimeSeriesPoint[];
  /** "Nedir?" — what this indicator measures, in Turkish. */
  whatItIs: string;
  /** "Nasıl yorumlanır?" — how a reader should interpret the reading. */
  howToInterpret: string;
  /**
   * Optional provenance describing whether this observation came from
   * a live fetch, a cached fetch, or the mock fixture. Absent on
   * legacy fixtures; consumers should treat missing provenance as an
   * implicit `{ mode: "mock" }`.
   */
  provenance?: IndicatorProvenance | null;
}

export interface MacroRegionSnapshot {
  region: MacroRegion;
  /** ISO 8601 timestamp representing the "as-of" time for the snapshot. */
  asOf: string;
  indicators: MacroIndicator[];
}

export interface YieldCurveSnapshot {
  country: MacroRegion;
  tenYearYield: number;
  twoYearYield: number;
  /** 10Y minus 2Y, in percent (e.g. `-0.18` = inverted by 18 bps). */
  spread: number;
  slopeTrend: TrendDirection;
  updatedAt: string;
  /** Optional extended tenor series for an ASCII-style curve chart. */
  tenors?: YieldCurvePoint[];
  /** Short Turkish explanation of what the curve tells the reader. */
  interpretation?: string | null;
  /** Structured attribution for the yield curve data. */
  source: DataSource;
}

export interface YieldCurvePoint {
  /** Tenor label (e.g. "3M", "2Y", "10Y"). */
  tenor: string;
  /** Tenor in years, for curve ordering / plotting. */
  tenorYears: number;
  /** Yield in percent (e.g. `4.28`). */
  yield: number;
}

export interface MacroSignalCard {
  id: string;
  /** Turkish headline for the signal. */
  title: string;
  /** Turkish one-paragraph summary. */
  summary: string;
  severity: SignalSeverity;
  /** Model confidence (0.0–1.0). */
  confidence: number;
  /** Structured attribution for the signal. */
  source: DataSource;
  /** Indicator ids this signal is derived from. */
  relatedIndicators: string[];
  /** Region this signal applies to; `null` means cross-region. */
  region: MacroRegion | null;
  updatedAt: string;
}

export interface MacroTheme {
  id: string;
  /** Turkish theme name. */
  themeName: string;
  /** Turkish description / thesis. */
  description: string;
  /** Indicator ids that make up the theme / watchlist. */
  indicators: string[];
  /** Optional directional bias label (Turkish, e.g. "savunmacı"). */
  bias?: string | null;
  region: MacroRegion | null;
}

export interface MacroCalendarItem {
  id: string;
  /** Turkish event name. */
  eventName: string;
  region: MacroRegion;
  /** ISO 8601 timestamp the event is scheduled for. */
  scheduledAt: string;
  expectedImpact: EventImpact;
  /** Realized / actual value, once released. `null` until then. */
  actual: number | string | null;
  /** Consensus expectation. `null` if none published. */
  consensus: number | string | null;
  /** Optional prior value, for context. */
  previous?: number | string | null;
  /** Structured attribution for the event data. */
  source: DataSource;
  /** Optional indicator ids the event moves. */
  relatedIndicators?: string[];
}

/**
 * Top-of-dashboard AI synthesis that answers the product question
 * "is the current macro backdrop an investable environment?". Content
 * is Turkish-first; consumers must render the headline + narrative
 * together with the source attributions so the reader can audit the
 * inputs.
 */
export interface MacroAiSummary {
  id: string;
  /** ISO 8601 timestamp the assessment was generated at. */
  generatedAt: string;
  verdict: InvestabilityVerdict;
  /** Turkish headline (e.g. "Seçici yatırım ortamı"). */
  headline: string;
  /** Turkish paragraph-level narrative explaining the verdict. */
  narrative: string;
  /** Turkish bullet points citing supportive indicators. */
  highlights: string[];
  /** Turkish bullet points citing risks / watch items. */
  risks: string[];
  /** Model confidence (0.0–1.0). */
  confidence: number;
  /** Model / method label (e.g. "mock: rule-based synthesis"). */
  model: string;
  /** Indicator / signal ids referenced in the narrative. */
  relatedIndicators: string[];
  /** Attribution for every feed that shaped the assessment. */
  sources: DataSource[];
}

/** Envelope for the Epic 1 macro dashboard payload. */
export interface MacroDashboard {
  generatedAt: string;
  /** Source label for the overall payload (e.g. "mock", "aggregator"). */
  source: string;
  /**
   * Overall resolution mode across the dashboard. `live` when every
   * mapped indicator was served from a provider this cycle, `mixed`
   * when at least one live + one cached/mock indicator is present,
   * and `mock` when the entire payload came from fixtures.
   */
  mode?: ProviderMode | "mixed";
  regions: MacroRegionSnapshot[];
  yieldCurves: YieldCurveSnapshot[];
  signals: MacroSignalCard[];
  themes: MacroTheme[];
  calendar: MacroCalendarItem[];
  /** Top-level AI summary. `null` when the model has no assessment yet. */
  aiSummary: MacroAiSummary | null;
  /**
   * Per-provider health snapshot surfaced to the UI. Absent on
   * legacy mock-only payloads; consumers should default to an empty
   * list when missing.
   */
  providerStatus?: ProviderStatus[];
}
