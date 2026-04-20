import type { DashboardState, MarketSnapshot } from "@/lib/types";
import {
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/format";

import { SectionStateView } from "./SectionState";

interface Props {
  items: MarketSnapshot[];
  state?: DashboardState;
}

const TREND_SYMBOL = {
  up: "▲",
  down: "▼",
  flat: "▬",
} as const;

export function MarketSnapshotPanel({ items, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && items.length === 0 ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={3}
      emptyMessage="No market data."
      errorMessage="Couldn't load market snapshot."
    >
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
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>
                  <strong>{m.label}</strong>{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    {m.symbol}
                  </span>
                </div>
                <div className={trendClass}>
                  {TREND_SYMBOL[m.trend]} {formatNumber(m.currentValue)} (
                  {formatPercent(m.changePercent)})
                </div>
              </div>
              <div className="meta">Updated {formatDateTime(m.updatedAt)}</div>
            </div>
          );
        })}
      </div>
    </SectionStateView>
  );
}
