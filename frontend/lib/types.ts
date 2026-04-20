// Epic 1 — Macro Dashboard domain types.
//
// These shapes drive the macro strategy dashboard (US + Turkey). The
// dashboard is mock-first: every surface reads typed fixtures and no
// live data source is wired in yet.
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
  | "inflation";

export type IndicatorUnit =
  | "percent"
  | "bps"
  | "index"
  | "usd_trillions"
  | "usd_billions"
  | "ratio";

export type EventImpact = "low" | "medium" | "high";

export type DashboardState = "loading" | "empty" | "populated" | "error";

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
  label: string;
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
  /** Human-readable source label (e.g. "FRED", "TCMB", "CBOE"). */
  source: string;
  /** Recent observations powering sparklines / trend charts. */
  history: MacroTimeSeriesPoint[];
  /** Short descriptive blurb shown under the KPI. */
  description?: string | null;
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
  title: string;
  summary: string;
  severity: SignalSeverity;
  /** Model confidence (0.0–1.0). */
  confidence: number;
  source: string | null;
  /** Indicator ids this signal is derived from. */
  relatedIndicators: string[];
  /** Region this signal applies to; `null` means cross-region. */
  region: MacroRegion | null;
  updatedAt: string;
}

export interface MacroTheme {
  id: string;
  themeName: string;
  description: string;
  /** Indicator ids that make up the theme / watchlist. */
  indicators: string[];
  /** Optional directional bias label (e.g. "pro-risk", "defensive"). */
  bias?: string | null;
  region: MacroRegion | null;
}

export interface MacroCalendarItem {
  id: string;
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
  source: string;
  /** Optional indicator ids the event moves. */
  relatedIndicators?: string[];
}

/** Envelope for the Epic 1 macro dashboard payload. */
export interface MacroDashboard {
  generatedAt: string;
  /** Source label for the overall payload (e.g. "mock", "aggregator"). */
  source: string;
  regions: MacroRegionSnapshot[];
  yieldCurves: YieldCurveSnapshot[];
  signals: MacroSignalCard[];
  themes: MacroTheme[];
  calendar: MacroCalendarItem[];
}
