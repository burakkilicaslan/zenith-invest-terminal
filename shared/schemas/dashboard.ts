// Macro Dashboard domain schema (Epic 1.1)
//
// Source of truth for the Macro Dashboard's typed domain objects.
// Mock-first: all consumers (frontend and backend) must be able to
// build against these shapes without a live data source.
//
// Conventions:
// - Dates are ISO 8601 strings.
// - Numeric fields stay numeric in transport; UI is responsible for
//   formatting currency and percentages.
// - Optional fields are represented as `T | null` so absence is explicit.

export type AssetClass =
  | "equity"
  | "fixed_income"
  | "cash"
  | "crypto"
  | "commodity"
  | "alternative";

export type TrendDirection = "up" | "down" | "flat";

export type InsightSeverity = "info" | "watch" | "warning" | "critical";

export type InsightCategory =
  | "macro"
  | "market"
  | "portfolio"
  | "signal"
  | "news";

export type ActivityType =
  | "trade"
  | "deposit"
  | "withdrawal"
  | "dividend"
  | "rebalance"
  | "system";

export interface DateRange {
  start: string;
  end: string;
}

export interface AllocationSlice {
  assetClass: AssetClass;
  allocationPercent: number;
}

export interface DashboardSummary {
  dateRange: DateRange;
  totalPortfolioValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  cashBalance: number;
  investedBalance: number;
  allocationOverview: AllocationSlice[];
}

export interface AssetPosition {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  marketPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  allocationPercent: number;
}

export interface MarketSnapshot {
  symbol: string;
  label: string;
  currentValue: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  updatedAt: string;
}

export interface InsightCard {
  id: string;
  title: string;
  summary: string;
  severity: InsightSeverity;
  category: InsightCategory;
  confidence: number;
  source: string | null;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  description: string;
  relatedSymbol: string | null;
}

export interface MacroDashboard {
  summary: DashboardSummary;
  positions: AssetPosition[];
  marketSnapshot: MarketSnapshot[];
  insights: InsightCard[];
  activity: ActivityItem[];
}
