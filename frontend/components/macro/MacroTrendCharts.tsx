import type { DashboardState, MacroIndicator } from "@/lib/types";
import {
  formatIndicatorChange,
  formatIndicatorValue,
  formatPercent,
} from "@/lib/format";

import { Sparkline } from "./Sparkline";
import { SectionStateView } from "../dashboard/SectionState";

interface Props {
  indicators: MacroIndicator[];
  state?: DashboardState;
}

/**
 * Trend-chart grid: for each macro indicator, render a larger sparkline
 * with its headline value and delta.
 */
export function MacroTrendCharts({ indicators, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && indicators.length === 0 ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={3}
      emptyMessage="Bu bölge için trend verisi yok."
      errorMessage="Makro trend grafikleri yüklenemedi."
    >
      <div className="trend-grid">
        {indicators.map((indicator) => {
          const trendClass =
            indicator.trend === "up"
              ? "positive"
              : indicator.trend === "down"
                ? "negative"
                : "neutral";
          return (
            <div className="trend-card" key={indicator.id}>
              <div className="trend-card-head">
                <span className="trend-card-title">{indicator.label}</span>
                <span className={`trend-card-change ${trendClass}`}>
                  {formatIndicatorChange(indicator.change, indicator.unit)} ·{" "}
                  {formatPercent(indicator.changePercent)}
                </span>
              </div>
              <div className="trend-card-value">
                {formatIndicatorValue(indicator.value, indicator.unit)}
              </div>
              <Sparkline
                points={indicator.history}
                trend={indicator.trend}
                width={260}
                height={56}
                ariaLabel={`${indicator.label} trend grafiği`}
              />
            </div>
          );
        })}
      </div>
    </SectionStateView>
  );
}
