import type {
  MacroCalendarItem,
  MacroDashboard,
  MacroIndicator,
  MacroRegionSnapshot,
  MacroSignalCard,
  MacroTheme,
  MacroTimeSeriesPoint,
  YieldCurveSnapshot,
} from "../types";

/**
 * Deterministic mock Macro Dashboard payload.
 *
 * Drives the full Epic 1 macro strategy dashboard (US + Turkey) without
 * any live data integration. Values are realistic enough to make the UI
 * meaningful but should not be used for analysis.
 */

function buildHistory(
  start: string,
  values: number[],
  stepDays = 5,
): MacroTimeSeriesPoint[] {
  const startMs = Date.parse(start);
  const stepMs = stepDays * 24 * 60 * 60 * 1000;
  return values.map((value, i) => ({
    timestamp: new Date(startMs + i * stepMs).toISOString(),
    value,
    benchmark: null,
    change: i === 0 ? null : value - values[i - 1],
  }));
}

const GENERATED_AT = "2026-04-19T20:00:00Z";

// ---------- US indicators ----------

const us10y: MacroIndicator = {
  id: "us-10y",
  label: "US 10Y Treasury Yield",
  region: "us",
  category: "rates",
  value: 4.28,
  unit: "percent",
  change: -0.03,
  changePercent: -0.7,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: "FRED",
  history: buildHistory("2026-01-10T00:00:00Z", [
    4.02, 4.11, 4.18, 4.25, 4.33, 4.4, 4.46, 4.42, 4.38, 4.35, 4.32, 4.3, 4.29,
    4.28,
  ]),
  description: "Benchmark long-end US Treasury yield.",
};

const us2y: MacroIndicator = {
  id: "us-2y",
  label: "US 2Y Treasury Yield",
  region: "us",
  category: "rates",
  value: 4.42,
  unit: "percent",
  change: -0.02,
  changePercent: -0.45,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: "FRED",
  history: buildHistory("2026-01-10T00:00:00Z", [
    4.55, 4.6, 4.58, 4.55, 4.52, 4.5, 4.48, 4.47, 4.46, 4.45, 4.44, 4.43, 4.42,
    4.42,
  ]),
  description: "Policy-sensitive front-end US yield.",
};

const us10y2ySpread: MacroIndicator = {
  id: "us-10y-2y",
  label: "10Y–2Y Spread",
  region: "us",
  category: "curve",
  value: -0.14,
  unit: "percent",
  change: -0.01,
  changePercent: 7.69,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: "FRED",
  history: buildHistory("2026-01-10T00:00:00Z", [
    -0.53, -0.49, -0.4, -0.3, -0.19, -0.1, -0.02, -0.05, -0.08, -0.1, -0.12,
    -0.13, -0.13, -0.14,
  ]),
  description: "Curve slope. Negative = inverted.",
};

const vix: MacroIndicator = {
  id: "us-vix",
  label: "VIX (Volatility Index)",
  region: "us",
  category: "volatility",
  value: 17.42,
  unit: "index",
  change: 0.84,
  changePercent: 5.06,
  trend: "up",
  updatedAt: GENERATED_AT,
  source: "CBOE",
  history: buildHistory("2026-01-10T00:00:00Z", [
    13.1, 13.8, 14.2, 14.0, 14.6, 15.1, 15.5, 15.9, 16.2, 16.5, 16.8, 17.0,
    16.6, 17.42,
  ]),
  description: "30-day implied S&P 500 volatility.",
};

const fedBalanceSheet: MacroIndicator = {
  id: "us-fed-bs",
  label: "Fed Balance Sheet",
  region: "us",
  category: "liquidity",
  value: 7.21,
  unit: "usd_trillions",
  change: -0.02,
  changePercent: -0.28,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: "FRED (WALCL)",
  history: buildHistory("2026-01-10T00:00:00Z", [
    7.55, 7.5, 7.46, 7.42, 7.38, 7.34, 7.31, 7.29, 7.27, 7.26, 7.25, 7.23,
    7.22, 7.21,
  ]),
  description: "Total assets on the Federal Reserve balance sheet.",
};

// ---------- TR indicators ----------

const tr5yCds: MacroIndicator = {
  id: "tr-5y-cds",
  label: "Turkey 5Y CDS",
  region: "tr",
  category: "credit",
  value: 268,
  unit: "bps",
  change: -6,
  changePercent: -2.19,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: "IHS Markit (mock)",
  history: buildHistory("2026-01-10T00:00:00Z", [
    325, 318, 310, 305, 298, 291, 285, 280, 278, 275, 273, 272, 270, 268,
  ]),
  description: "Sovereign 5Y credit default swap spread.",
};

const tcmbReserves: MacroIndicator = {
  id: "tr-tcmb-reserves",
  label: "TCMB FX Reserves",
  region: "tr",
  category: "reserves",
  value: 156.4,
  unit: "usd_billions",
  change: 2.1,
  changePercent: 1.36,
  trend: "up",
  updatedAt: GENERATED_AT,
  source: "TCMB",
  history: buildHistory("2026-01-10T00:00:00Z", [
    138.2, 140.0, 141.6, 143.1, 145.0, 146.8, 148.3, 149.9, 151.2, 152.6,
    153.8, 154.6, 155.3, 156.4,
  ]),
  description: "Gross FX reserves held at the Turkish central bank.",
};

const tcmbPolicyRate: MacroIndicator = {
  id: "tr-policy-rate",
  label: "TCMB Policy Rate",
  region: "tr",
  category: "policy",
  value: 42.5,
  unit: "percent",
  change: 0,
  changePercent: 0,
  trend: "flat",
  updatedAt: GENERATED_AT,
  source: "TCMB",
  history: buildHistory("2026-01-10T00:00:00Z", [
    50, 50, 47.5, 47.5, 47.5, 45, 45, 45, 42.5, 42.5, 42.5, 42.5, 42.5, 42.5,
  ]),
  description: "One-week repo rate (headline policy rate).",
};

const trCpiYoY: MacroIndicator = {
  id: "tr-cpi-yoy",
  label: "TR CPI (YoY)",
  region: "tr",
  category: "inflation",
  value: 38.2,
  unit: "percent",
  change: -1.4,
  changePercent: -3.54,
  trend: "down",
  updatedAt: GENERATED_AT,
  source: "TURKSTAT",
  history: buildHistory("2026-01-10T00:00:00Z", [
    55.1, 53.4, 51.2, 49.0, 46.8, 44.7, 43.1, 41.8, 40.9, 40.2, 39.6, 39.1,
    38.8, 38.2,
  ]),
  description: "Headline consumer inflation, year over year.",
};

// ---------- Region snapshots ----------

const usSnapshot: MacroRegionSnapshot = {
  region: "us",
  asOf: GENERATED_AT,
  indicators: [us10y, us2y, us10y2ySpread, vix, fedBalanceSheet],
};

const trSnapshot: MacroRegionSnapshot = {
  region: "tr",
  asOf: GENERATED_AT,
  indicators: [tr5yCds, tcmbReserves, tcmbPolicyRate, trCpiYoY],
};

// ---------- Yield curves ----------

const yieldCurves: YieldCurveSnapshot[] = [
  {
    country: "us",
    tenYearYield: 4.28,
    twoYearYield: 4.42,
    spread: -0.14,
    slopeTrend: "down",
    updatedAt: GENERATED_AT,
    tenors: [
      { tenor: "3M", tenorYears: 0.25, yield: 4.58 },
      { tenor: "6M", tenorYears: 0.5, yield: 4.52 },
      { tenor: "1Y", tenorYears: 1, yield: 4.47 },
      { tenor: "2Y", tenorYears: 2, yield: 4.42 },
      { tenor: "5Y", tenorYears: 5, yield: 4.18 },
      { tenor: "7Y", tenorYears: 7, yield: 4.22 },
      { tenor: "10Y", tenorYears: 10, yield: 4.28 },
      { tenor: "30Y", tenorYears: 30, yield: 4.55 },
    ],
  },
  {
    country: "tr",
    tenYearYield: 27.8,
    twoYearYield: 39.4,
    spread: -11.6,
    slopeTrend: "up",
    updatedAt: GENERATED_AT,
    tenors: [
      { tenor: "3M", tenorYears: 0.25, yield: 42.1 },
      { tenor: "6M", tenorYears: 0.5, yield: 41.2 },
      { tenor: "1Y", tenorYears: 1, yield: 40.3 },
      { tenor: "2Y", tenorYears: 2, yield: 39.4 },
      { tenor: "5Y", tenorYears: 5, yield: 32.1 },
      { tenor: "10Y", tenorYears: 10, yield: 27.8 },
    ],
  },
];

// ---------- Signals ----------

const signals: MacroSignalCard[] = [
  {
    id: "sig-001",
    title: "US curve remains inverted",
    summary:
      "10Y–2Y held near -14 bps this week. Recession signal persists even as the long end rallies.",
    severity: "watch",
    confidence: 0.68,
    source: "internal-curve-model",
    relatedIndicators: ["us-10y", "us-2y", "us-10y-2y"],
    region: "us",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-002",
    title: "Volatility drift higher",
    summary:
      "VIX closed at 17.4, above its 20-day mean. Positioning suggests hedging demand is rising.",
    severity: "info",
    confidence: 0.55,
    source: "internal-vol-model",
    relatedIndicators: ["us-vix"],
    region: "us",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-003",
    title: "Turkey CDS continues to tighten",
    summary:
      "5Y CDS fell to 268 bps, a multi-month low. FX reserves rebuild is supporting sovereign risk perception.",
    severity: "info",
    confidence: 0.71,
    source: "internal-credit-model",
    relatedIndicators: ["tr-5y-cds", "tr-tcmb-reserves"],
    region: "tr",
    updatedAt: GENERATED_AT,
  },
  {
    id: "sig-004",
    title: "TCMB likely on hold into next meeting",
    summary:
      "Policy rate unchanged at 42.5% with disinflation continuing. Forward guidance remains hawkish.",
    severity: "watch",
    confidence: 0.6,
    source: "internal-policy-model",
    relatedIndicators: ["tr-policy-rate", "tr-cpi-yoy"],
    region: "tr",
    updatedAt: GENERATED_AT,
  },
];

// ---------- Themes / watchlists ----------

const themes: MacroTheme[] = [
  {
    id: "theme-us-recession-watch",
    themeName: "US recession watch",
    description:
      "Curve, volatility and liquidity gauges we watch for a growth slowdown.",
    indicators: ["us-10y-2y", "us-vix", "us-fed-bs"],
    bias: "defensive",
    region: "us",
  },
  {
    id: "theme-us-rates-path",
    themeName: "US rates path",
    description: "Inputs into the next Fed policy decision.",
    indicators: ["us-10y", "us-2y", "us-fed-bs"],
    bias: "neutral",
    region: "us",
  },
  {
    id: "theme-tr-disinflation",
    themeName: "TR disinflation trajectory",
    description:
      "Indicators tracking Turkey's path back to single-digit inflation.",
    indicators: ["tr-cpi-yoy", "tr-policy-rate", "tr-5y-cds"],
    bias: "pro-normalization",
    region: "tr",
  },
  {
    id: "theme-tr-external-buffers",
    themeName: "TR external buffers",
    description: "Reserves and credit risk gauges for external stability.",
    indicators: ["tr-tcmb-reserves", "tr-5y-cds"],
    bias: "improving",
    region: "tr",
  },
];

// ---------- Calendar ----------

const calendar: MacroCalendarItem[] = [
  {
    id: "evt-fomc-minutes",
    eventName: "FOMC Minutes",
    region: "us",
    scheduledAt: "2026-04-22T18:00:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: null,
    previous: null,
    source: "Federal Reserve",
    relatedIndicators: ["us-10y", "us-2y", "us-fed-bs"],
  },
  {
    id: "evt-us-cpi",
    eventName: "US CPI (MoM)",
    region: "us",
    scheduledAt: "2026-04-24T12:30:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "0.2%",
    previous: "0.3%",
    source: "BLS",
    relatedIndicators: ["us-10y", "us-2y"],
  },
  {
    id: "evt-us-nfp",
    eventName: "US Non-Farm Payrolls",
    region: "us",
    scheduledAt: "2026-05-02T12:30:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "185K",
    previous: "212K",
    source: "BLS",
    relatedIndicators: ["us-2y", "us-vix"],
  },
  {
    id: "evt-tcmb-decision",
    eventName: "TCMB Rate Decision",
    region: "tr",
    scheduledAt: "2026-04-25T11:00:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "42.5%",
    previous: "42.5%",
    source: "TCMB",
    relatedIndicators: ["tr-policy-rate", "tr-5y-cds"],
  },
  {
    id: "evt-tr-cpi",
    eventName: "Turkey CPI (YoY)",
    region: "tr",
    scheduledAt: "2026-05-05T07:00:00Z",
    expectedImpact: "high",
    actual: null,
    consensus: "36.9%",
    previous: "38.2%",
    source: "TURKSTAT",
    relatedIndicators: ["tr-cpi-yoy", "tr-policy-rate"],
  },
  {
    id: "evt-tr-reserves",
    eventName: "TCMB Weekly Reserves",
    region: "tr",
    scheduledAt: "2026-04-24T11:00:00Z",
    expectedImpact: "medium",
    actual: null,
    consensus: null,
    previous: "$155.3B",
    source: "TCMB",
    relatedIndicators: ["tr-tcmb-reserves"],
  },
];

export const mockMacroDashboard: MacroDashboard = {
  generatedAt: GENERATED_AT,
  source: "mock",
  regions: [usSnapshot, trSnapshot],
  yieldCurves,
  signals,
  themes,
  calendar,
};

export const emptyMacroDashboard: MacroDashboard = {
  generatedAt: GENERATED_AT,
  source: "mock",
  regions: [
    { region: "us", asOf: GENERATED_AT, indicators: [] },
    { region: "tr", asOf: GENERATED_AT, indicators: [] },
  ],
  yieldCurves: [],
  signals: [],
  themes: [],
  calendar: [],
};
