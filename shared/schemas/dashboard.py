"""Macro Dashboard domain schema (Epic 1.1).

Python mirror of ``shared/schemas/dashboard.ts``. Backend handlers must
build against these typed domain objects so the frontend and backend
consume a single, mock-friendly contract.

The models are Pydantic v2 ``BaseModel`` subclasses so FastAPI can use
them directly for request/response validation and OpenAPI generation.

Conventions:
    * Dates are ISO 8601 strings.
    * Numeric fields stay numeric in transport.
    * Optional fields are typed ``Optional[T]`` to keep absence explicit.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

AssetClass = Literal[
    "equity",
    "fixed_income",
    "cash",
    "crypto",
    "commodity",
    "alternative",
]

TrendDirection = Literal["up", "down", "flat"]

InsightSeverity = Literal["info", "watch", "warning", "critical"]

InsightCategory = Literal[
    "macro",
    "market",
    "portfolio",
    "signal",
    "news",
]

ActivityType = Literal[
    "trade",
    "deposit",
    "withdrawal",
    "dividend",
    "rebalance",
    "system",
]


class DashboardModel(BaseModel):
    """Base model for the dashboard domain.

    * ``extra="forbid"`` catches payloads with unexpected fields early.
    * ``frozen=True`` keeps domain instances immutable.
    * ``populate_by_name=True`` allows construction from aliases if we
      ever need to accept snake_case inputs alongside the canonical
      camelCase on the wire.
    """

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        populate_by_name=True,
    )


class DateRange(DashboardModel):
    start: str
    end: str


class AllocationSlice(DashboardModel):
    assetClass: AssetClass
    allocationPercent: float


class DashboardSummary(DashboardModel):
    dateRange: DateRange
    totalPortfolioValue: float
    dailyChange: float
    dailyChangePercent: float
    cashBalance: float
    investedBalance: float
    allocationOverview: List[AllocationSlice] = Field(default_factory=list)


class AssetPosition(DashboardModel):
    symbol: str
    name: str
    assetClass: AssetClass
    quantity: float
    marketPrice: float
    marketValue: float
    costBasis: float
    unrealizedPnL: float
    unrealizedPnLPercent: float
    allocationPercent: float


class MarketSnapshot(DashboardModel):
    symbol: str
    label: str
    currentValue: float
    change: float
    changePercent: float
    trend: TrendDirection
    updatedAt: str


class InsightCard(DashboardModel):
    id: str
    title: str
    summary: str
    severity: InsightSeverity
    category: InsightCategory
    confidence: float
    source: Optional[str] = None


class ActivityItem(DashboardModel):
    id: str
    timestamp: str
    type: ActivityType
    title: str
    description: str
    relatedSymbol: Optional[str] = None


class MacroDashboard(DashboardModel):
    summary: DashboardSummary
    positions: List[AssetPosition]
    marketSnapshot: List[MarketSnapshot]
    insights: List[InsightCard]
    activity: List[ActivityItem]
