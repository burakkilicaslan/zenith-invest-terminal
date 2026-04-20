import type { DashboardSummary } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

interface Props {
  summary: DashboardSummary;
}

export function SummaryStrip({ summary }: Props) {
  const changeClass =
    summary.dailyChange > 0
      ? "positive"
      : summary.dailyChange < 0
        ? "negative"
        : "neutral";

  return (
    <>
      <div className="card summary-metric">
        <div className="label">Portfolio value</div>
        <div className="value">
          {formatCurrency(summary.totalPortfolioValue)}
        </div>
        <div className="label" style={{ marginTop: 6 }}>
          {formatDate(summary.dateRange.start)} –{" "}
          {formatDate(summary.dateRange.end)}
        </div>
      </div>

      <div className="card summary-metric">
        <div className="label">Daily change</div>
        <div className={`value ${changeClass}`}>
          {formatCurrency(summary.dailyChange)}{" "}
          <span style={{ fontSize: 14 }}>
            ({formatPercent(summary.dailyChangePercent)})
          </span>
        </div>
      </div>

      <div className="card summary-metric">
        <div className="label">Cash balance</div>
        <div className="value">{formatCurrency(summary.cashBalance)}</div>
      </div>

      <div className="card summary-metric">
        <div className="label">Invested balance</div>
        <div className="value">{formatCurrency(summary.investedBalance)}</div>
      </div>
    </>
  );
}
