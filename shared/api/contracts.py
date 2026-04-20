"""Macro Dashboard API contracts (Epic 1.2).

Python mirror of ``shared/api/contracts.ts``. The FastAPI backend owns
request validation and must respond with these envelope shapes.

The models are Pydantic v2 ``BaseModel`` subclasses so FastAPI can use
them directly for request/response validation and OpenAPI generation.
Handlers may return fixtures until real data sources exist; domain
object shapes are imported from ``shared.schemas.dashboard`` (Epic 1.1).
"""

from __future__ import annotations

from typing import Any, Dict, Generic, List, Literal, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field

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


class ContractModel(BaseModel):
    """Base model for API envelope contracts.

    * ``extra="forbid"`` keeps envelopes tight so extra fields don't
      silently creep into responses.
    * ``populate_by_name=True`` leaves room to accept snake_case inputs
      alongside the canonical camelCase on the wire without renaming
      fields.
    """

    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
    )


class ApiMeta(ContractModel):
    requestId: str
    generatedAt: str
    source: Literal["mock", "live"]


class PaginationMeta(ContractModel):
    page: int
    pageSize: int
    totalItems: int
    hasNextPage: bool


class ListApiMeta(ApiMeta):
    """Meta block used by list endpoints — adds a ``pagination`` block."""

    pagination: PaginationMeta


TData = TypeVar("TData")


class ApiSuccess(ContractModel, Generic[TData]):
    """Generic success envelope. Parameterize with the payload type."""

    data: TData
    meta: ApiMeta


class ApiErrorBody(ContractModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


class ApiErrorMeta(ContractModel):
    requestId: str
    generatedAt: str


class ApiError(ContractModel):
    error: ApiErrorBody
    meta: ApiErrorMeta


class DashboardSummaryResponse(ApiSuccess[DashboardSummary]):
    pass


class PositionsResponse(ContractModel):
    data: List[AssetPosition] = Field(default_factory=list)
    meta: ListApiMeta


class MarketSnapshotResponse(ApiSuccess[List[MarketSnapshot]]):
    pass


class InsightsResponse(ContractModel):
    data: List[InsightCard] = Field(default_factory=list)
    meta: ListApiMeta


class ActivityResponse(ContractModel):
    data: List[ActivityItem] = Field(default_factory=list)
    meta: ListApiMeta


class DashboardAggregateResponse(ApiSuccess[MacroDashboard]):
    pass
