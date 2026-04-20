import type { MacroIndicator } from "@/lib/types";
import {
  formatIndicatorChange,
  formatIndicatorValue,
  formatPercent,
} from "@/lib/format";

import { FreshnessBadge } from "./FreshnessBadge";
import { Sparkline } from "./Sparkline";

interface Props {
  indicator: MacroIndicator;
}

const TREND_SYMBOL = {
  up: "▲",
  down: "▼",
  flat: "▬",
} as const;

function categoryLabel(category: MacroIndicator["category"]): string {
  switch (category) {
    case "rates":
      return "Rates";
    case "curve":
      return "Curve";
    case "volatility":
      return "Volatility";
    case "liquidity":
      return "Liquidity";
    case "credit":
      return "Credit";
    case "reserves":
      return "Reserves";
    case "policy":
      return "Policy";
    case "fx":
      return "FX";
    case "inflation":
      return "Inflation";
  }
}

/**
 * KPI card for a single macro indicator.
 *
 * Shows headline value, delta vs. prior observation, a sparkline of
 * recent history, and a freshness badge with source + last updated.
 */
export function MacroKpiCard({ indicator }: Props) {
  const trendClass =
    indicator.trend === "up"
      ? "positive"
      : indicator.trend === "down"
        ? "negative"
        : "neutral";

  return (
    <article
      className="card macro-kpi-card"
      aria-label={`${indicator.label} KPI`}
    >
      <header className="macro-kpi-head">
        <div>
          <div className="macro-kpi-label">{indicator.label}</div>
          <div className="macro-kpi-category">
            {categoryLabel(indicator.category)}
          </div>
        </div>
        <Sparkline
          points={indicator.history}
          trend={indicator.trend}
          ariaLabel={`${indicator.label} sparkline`}
        />
      </header>

      <div className="macro-kpi-value-row">
        <span className="macro-kpi-value">
          {formatIndicatorValue(indicator.value, indicator.unit)}
        </span>
        <span className={`macro-kpi-change ${trendClass}`}>
          {TREND_SYMBOL[indicator.trend]}{" "}
          {formatIndicatorChange(indicator.change, indicator.unit)}
          {" · "}
          {formatPercent(indicator.changePercent)}
        </span>
      </div>

      {indicator.description ? (
        <p className="macro-kpi-description">{indicator.description}</p>
      ) : null}

      <FreshnessBadge
        source={indicator.source}
        updatedAt={indicator.updatedAt}
        compact
      />
    </article>
  );
}
