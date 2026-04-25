import type { DataSource } from "../types";
import { FRED_SERIES, fetchFredSeries, type FredSeriesId } from "./providers/fred";
import { fetchFmpTreasury, type FmpTreasuryTenor } from "./providers/fmp";
import { fetchPolygonIndexAgg } from "./providers/polygon";
import { TCMB_SERIES, fetchTcmbSeries, type TcmbSeriesId } from "./providers/tcmb";
import { fetchCanSlimExposure } from "./providers/canSlim";
import { fetchFearGreedIndex } from "./providers/fearGreed";
import type { LiveObservation } from "./providers/common";

export type LiveFetcher = (apiKey?: string | null) => Promise<LiveObservation>;

export interface LiveBinding {
  primary: string;
  primaryCacheKey: string;
  source: DataSource;
  fetchPrimary: LiveFetcher;
  usesApiKey?: boolean;
  secondary?: {
    code: string;
    cacheKey: string;
    source: DataSource;
    fetch: LiveFetcher;
    usesApiKey?: boolean;
  };
  transform?: (obs: LiveObservation) => LiveObservation;
}

export const LIVE_BINDINGS: Record<string, LiveBinding> = {
  "us-10y": {
    primary: "FRED",
    primaryCacheKey: "FRED:DGS10",
    source: { code: "FRED", label: "Federal Reserve Economic Data", url: "https://fred.stlouisfed.org" },
    fetchPrimary: (apiKey) =>
      fetchFredSeries({ apiKey: apiKey ?? "" }, { seriesId: FRED_SERIES.US_10Y }),
    secondary: {
      code: "FMP",
      cacheKey: "FMP:treasury:year10",
      source: { code: "FMP", label: "Financial Modeling Prep", url: "https://financialmodelingprep.com" },
      fetch: (apiKey) => fetchFmpTreasury({ apiKey: apiKey ?? "" }, { tenor: "year10" }),
      usesApiKey: true,
    },
  },
  "us-2y": {
    primary: "FRED",
    primaryCacheKey: "FRED:DGS2",
    source: { code: "FRED", label: "Federal Reserve Economic Data", url: "https://fred.stlouisfed.org" },
    fetchPrimary: (apiKey) =>
      fetchFredSeries({ apiKey: apiKey ?? "" }, { seriesId: FRED_SERIES.US_2Y }),
    secondary: {
      code: "FMP",
      cacheKey: "FMP:treasury:year2",
      source: { code: "FMP", label: "Financial Modeling Prep", url: "https://financialmodelingprep.com" },
      fetch: (apiKey) => fetchFmpTreasury({ apiKey: apiKey ?? "" }, { tenor: "year2" }),
      usesApiKey: true,
    },
  },
  "us-10y-2y": {
    primary: "FRED",
    primaryCacheKey: "FRED:T10Y2Y",
    source: { code: "FRED", label: "Federal Reserve Economic Data", url: "https://fred.stlouisfed.org" },
    fetchPrimary: (apiKey) =>
      fetchFredSeries(
        { apiKey: apiKey ?? "" },
        { seriesId: FRED_SERIES.US_10Y_2Y_SPREAD },
      ),
  },
  "us-vix": {
    primary: "FRED",
    primaryCacheKey: "FRED:VIXCLS",
    source: { code: "FRED", label: "Federal Reserve Economic Data", url: "https://fred.stlouisfed.org" },
    fetchPrimary: (apiKey) =>
      fetchFredSeries({ apiKey: apiKey ?? "" }, { seriesId: FRED_SERIES.US_VIX }),
    secondary: {
      code: "Polygon",
      cacheKey: "Polygon:I:VIX",
      source: { code: "Polygon", label: "Polygon.io", url: "https://polygon.io" },
      fetch: (apiKey) =>
        fetchPolygonIndexAgg({ apiKey: apiKey ?? "" }, { ticker: "I:VIX" }),
      usesApiKey: true,
    },
  },
  "us-fed-bs": {
    primary: "FRED",
    primaryCacheKey: "FRED:WALCL",
    source: { code: "FRED", label: "Federal Reserve Economic Data", url: "https://fred.stlouisfed.org" },
    fetchPrimary: (apiKey) =>
      fetchFredSeries(
        { apiKey: apiKey ?? "" },
        { seriesId: FRED_SERIES.US_FED_BALANCE_SHEET },
      ),
    usesApiKey: true,
    transform: (obs) => scaleObservation(obs, 1 / 1_000_000),
  },
  "us-fear-greed": {
    primary: "Alternative",
    primaryCacheKey: "Alternative:fear-greed",
    source: {
      code: "Alternative",
      label: "Alternative.me Fear & Greed Index",
      url: "https://alternative.me/crypto/fear-and-greed-index/",
    },
    fetchPrimary: () => fetchFearGreedIndex(),
    usesApiKey: false,
  },
  "us-canslim-exposure": {
    primary: "Yahoo",
    primaryCacheKey: "Yahoo:canslim-exposure",
    source: {
      code: "Yahoo",
      label: "Zenith CAN SLIM model (Yahoo Finance)",
      url: "https://finance.yahoo.com",
    },
    fetchPrimary: () => fetchCanSlimExposure(),
    usesApiKey: false,
  },
  "tr-policy-rate": {
    primary: "TCMB",
    primaryCacheKey: `TCMB:${TCMB_SERIES.POLICY_RATE}`,
    source: { code: "TCMB", label: "Türkiye Cumhuriyet Merkez Bankası (EVDS)", url: "https://evds2.tcmb.gov.tr" },
    fetchPrimary: (apiKey) =>
      fetchTcmbSeries({ apiKey: apiKey ?? "" }, { seriesId: TCMB_SERIES.POLICY_RATE }),
  },
  "tr-tcmb-reserves": {
    primary: "TCMB",
    primaryCacheKey: `TCMB:${TCMB_SERIES.TCMB_RESERVES}`,
    source: { code: "TCMB", label: "Türkiye Cumhuriyet Merkez Bankası (EVDS)", url: "https://evds2.tcmb.gov.tr" },
    fetchPrimary: (apiKey) =>
      fetchTcmbSeries(
        { apiKey: apiKey ?? "" },
        { seriesId: TCMB_SERIES.TCMB_RESERVES, frequency: 3 },
      ),
  },
  "tr-cpi-yoy": {
    primary: "TCMB",
    primaryCacheKey: `TCMB:${TCMB_SERIES.CPI_YOY}`,
    source: { code: "TCMB", label: "Türkiye Cumhuriyet Merkez Bankası (EVDS)", url: "https://evds2.tcmb.gov.tr" },
    fetchPrimary: (apiKey) =>
      fetchTcmbSeries(
        { apiKey: apiKey ?? "" },
        { seriesId: TCMB_SERIES.CPI_YOY, frequency: 5 },
      ),
  },
};

export const PROVIDER_LABELS: Record<string, string> = {
  FRED: "Federal Reserve Economic Data",
  FMP: "Financial Modeling Prep",
  Polygon: "Polygon.io",
  TCMB: "Türkiye Cumhuriyet Merkez Bankası (EVDS)",
  Alternative: "Alternative.me Fear & Greed Index",
  Yahoo: "Zenith CAN SLIM model (Yahoo Finance)",
};

function scaleObservation(obs: LiveObservation, factor: number): LiveObservation {
  return {
    ...obs,
    value: obs.value * factor,
    previousValue:
      obs.previousValue !== null && obs.previousValue !== undefined
        ? obs.previousValue * factor
        : obs.previousValue ?? null,
    history: obs.history.map((point) => ({
      ...point,
      value: point.value * factor,
      change:
        point.change !== null && point.change !== undefined
          ? point.change * factor
          : point.change ?? null,
    })),
  };
}
