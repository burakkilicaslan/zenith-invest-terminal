// Macro Dashboard API contracts (Epic 1.2)
//
// This module defines the request/response envelopes exchanged between
// the FastAPI backend and the Next.js frontend for the Macro Dashboard.
//
// The contract is mock-first: handlers may return fixtures until real
// data sources are wired up. Domain object shapes are imported from the
// domain schema defined in Epic 1.1 (`shared/schemas/dashboard.ts`).

import type {
  ActivityItem,
  AssetPosition,
  DashboardSummary,
  InsightCard,
  MacroDashboard,
  MarketSnapshot,
} from "../schemas/dashboard";

/** Canonical dashboard API endpoint paths. */
export const DashboardEndpoints = {
  summary: "/api/dashboard/summary",
  positions: "/api/dashboard/positions",
  marketSnapshot: "/api/dashboard/market-snapshot",
  insights: "/api/dashboard/insights",
  activity: "/api/dashboard/activity",
} as const;

export type DashboardEndpointPath =
  (typeof DashboardEndpoints)[keyof typeof DashboardEndpoints];

/** Envelope metadata returned on every successful response. */
export interface ApiMeta {
  /** Server-generated identifier for the response (useful in logs). */
  requestId: string;
  /** ISO 8601 timestamp of when the response was generated. */
  generatedAt: string;
  /** Source of the payload — `"mock"` until live data is wired up. */
  source: "mock" | "live";
}

/** Optional pagination block, only present on endpoints that may grow. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
}

/** Successful response envelope. */
export interface ApiSuccess<TData, TMeta extends ApiMeta = ApiMeta> {
  data: TData;
  meta: TMeta;
}

/** Error response shape — used uniformly across all endpoints. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    /** Optional structured details, keyed for frontend handling. */
    details?: Record<string, unknown> | null;
  };
  meta: Pick<ApiMeta, "requestId" | "generatedAt">;
}

/** Common query parameters accepted by list endpoints. */
export interface ListQuery {
  page?: number;
  pageSize?: number;
}

/** GET /api/dashboard/summary */
export type DashboardSummaryResponse = ApiSuccess<DashboardSummary>;

/** GET /api/dashboard/positions */
export interface PositionsResponse
  extends ApiSuccess<AssetPosition[], ApiMeta & { pagination: PaginationMeta }> {}

/** GET /api/dashboard/market-snapshot */
export type MarketSnapshotResponse = ApiSuccess<MarketSnapshot[]>;

/** GET /api/dashboard/insights */
export interface InsightsResponse
  extends ApiSuccess<InsightCard[], ApiMeta & { pagination: PaginationMeta }> {}

/** GET /api/dashboard/activity */
export interface ActivityResponse
  extends ApiSuccess<ActivityItem[], ApiMeta & { pagination: PaginationMeta }> {}

/** Convenience aggregate for clients that want a single call. */
export type DashboardAggregateResponse = ApiSuccess<MacroDashboard>;

/**
 * Typed map from endpoint path to the expected response shape. Useful for
 * building a thin typed client without handwriting one function per endpoint.
 */
export interface DashboardResponseMap {
  [DashboardEndpoints.summary]: DashboardSummaryResponse;
  [DashboardEndpoints.positions]: PositionsResponse;
  [DashboardEndpoints.marketSnapshot]: MarketSnapshotResponse;
  [DashboardEndpoints.insights]: InsightsResponse;
  [DashboardEndpoints.activity]: ActivityResponse;
}
