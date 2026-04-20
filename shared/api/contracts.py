"""Macro Dashboard API contracts (Epic 1.2).

Python mirror of ``shared/api/contracts.ts``. The FastAPI backend owns
request validation and must respond with these envelope shapes.

Mock-first: handlers may return fixtures until real data sources exist.
Domain object shapes are imported from ``shared.schemas.dashboard``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Generic, List, Literal, Optional, TypeVar

from shared.schemas.dashboard import (
    ActivityItem,
    AssetPosition,
    DashboardSummary,
    InsightCard,
    MacroDashboard,
    MarketSnapshot,
)


class DashboardEndpoints:
    """Canonical dashboard API endpoint paths."""

    SUMMARY = "/api/dashboard/summary"
    POSITIONS = "/api/dashboard/positions"
    MARKET_SNAPSHOT = "/api/dashboard/market-snapshot"
    INSIGHTS = "/api/dashboard/insights"
    ACTIVITY = "/api/dashboard/activity"


@dataclass(frozen=True)
class ApiMeta:
    requestId: str
    generatedAt: str
    source: Literal["mock", "live"]


@dataclass(frozen=True)
class PaginationMeta:
    page: int
    pageSize: int
    totalItems: int
    hasNextPage: bool


TData = TypeVar("TData")


@dataclass(frozen=True)
class ApiSuccess(Generic[TData]):
    data: TData
    meta: ApiMeta


@dataclass(frozen=True)
class ApiErrorBody:
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class ApiErrorMeta:
    requestId: str
    generatedAt: str


@dataclass(frozen=True)
class ApiError:
    error: ApiErrorBody
    meta: ApiErrorMeta


@dataclass(frozen=True)
class ListApiMeta(ApiMeta):
    pagination: PaginationMeta


@dataclass(frozen=True)
class DashboardSummaryResponse(ApiSuccess[DashboardSummary]):
    pass


@dataclass(frozen=True)
class PositionsResponse:
    data: List[AssetPosition]
    meta: ListApiMeta


@dataclass(frozen=True)
class MarketSnapshotResponse(ApiSuccess[List[MarketSnapshot]]):
    pass


@dataclass(frozen=True)
class InsightsResponse:
    data: List[InsightCard]
    meta: ListApiMeta


@dataclass(frozen=True)
class ActivityResponse:
    data: List[ActivityItem]
    meta: ListApiMeta


@dataclass(frozen=True)
class DashboardAggregateResponse(ApiSuccess[MacroDashboard]):
    pass
