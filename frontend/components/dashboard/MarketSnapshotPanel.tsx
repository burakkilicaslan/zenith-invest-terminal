import type { MarketSnapshot } from "@/lib/types";
import {
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/format";

interface Props {
  items: MarketSnapshot[];
}

const TREND_SYMBOL = {
  up: "▲",
  down: "▼",
  flat: "▬",
} as const;

export function MarketSnapshotPanel({ items }: Props) {
  if (items.length === 0) {
    return <div className="state-empty">No market data.</div>;
  }

  return (
    <div className="market-list">
      {items.map((m) => {
        const trendClass =
          m.trend === "up"
            ? "positive"
            : m.trend === "down"
              ? "negative"
              : "neutral";
        return (
          <div className="market-item" key={m.symbol}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{m.label}</strong>{" "}
                <span style={{ color: "var(--text-muted)" }}>{m.symbol}</span>
              </div>
              <div className={trendClass}>
                {TREND_SYMBOL[m.trend]} {formatNumber(m.currentValue)}{" "}
                ({formatPercent(m.changePercent)})
              </div>
            </div>
            <div className="meta">Updated {formatDateTime(m.updatedAt)}</div>
          </div>
        );
      })}
    </div>
  );
}
