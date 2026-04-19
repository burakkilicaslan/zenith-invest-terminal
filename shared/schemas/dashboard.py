"""Macro Dashboard domain schema (Epic 1.1).

Python mirror of ``shared/schemas/dashboard.ts``. Backend handlers must
build against these typed domain objects so the frontend and backend
consume a single, mock-friendly contract.

Conventions:
    * Dates are ISO 8601 strings.
    * Numeric fields stay numeric in transport.
    * Optional fields are typed ``Optional[T]`` to keep absence explicit.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal, Optional

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


@dataclass(frozen=True)
class DateRange:
    start: str
    end: str


@dataclass(frozen=True)
class AllocationSlice:
    assetClass: AssetClass
    allocationPercent: float


@dataclass(frozen=True)
class DashboardSummary:
    dateRange: DateRange
    totalPortfolioValue: float
    dailyChange: float
    dailyChangePercent: float
    cashBalance: float
    investedBalance: float
    allocationOverview: List[AllocationSlice] = field(default_factory=list)


@dataclass(frozen=True)
class AssetPosition:
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


@dataclass(frozen=True)
class MarketSnapshot:
    symbol: str
    label: str
    currentValue: float
    change: float
    changePercent: float
    trend: TrendDirection
    updatedAt: str


@dataclass(frozen=True)
class InsightCard:
    id: str
    title: str
    summary: str
    severity: InsightSeverity
    category: InsightCategory
    confidence: float
    source: Optional[str] = None


@dataclass(frozen=True)
class ActivityItem:
    id: str
    timestamp: str
    type: ActivityType
    title: str
    description: str
    relatedSymbol: Optional[str] = None


@dataclass(frozen=True)
class MacroDashboard:
    summary: DashboardSummary
    positions: List[AssetPosition]
    marketSnapshot: List[MarketSnapshot]
    insights: List[InsightCard]
    activity: List[ActivityItem]
