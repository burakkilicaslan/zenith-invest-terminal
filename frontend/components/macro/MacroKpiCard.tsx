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
      return "Faiz";
    case "curve":
      return "Getiri eğrisi";
    case "volatility":
      return "Oynaklık";
    case "liquidity":
      return "Likidite";
    case "credit":
      return "Kredi riski";
    case "reserves":
      return "Rezervler";
    case "policy":
      return "Para politikası";
    case "fx":
      return "Kur";
    case "inflation":
      return "Enflasyon";
    case "sentiment":
      return "Yatırımcı duyarlılığı";
    case "breadth":
      return "Piyasa genişliği";
  }
}

/**
 * KPI card for a single macro indicator.
 *
 * Shows headline value, delta vs. prior observation, a sparkline of
 * recent history, a freshness badge with source + last updated, and
 * Turkish "nedir" / "nasıl yorumlanır" copy so every data point is
 * self-documenting.
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
      aria-label={`${indicator.label} göstergesi`}
    >
      <header className="macro-kpi-head">
        <div>
          <div className="macro-kpi-label">{indicator.label}</div>
          {indicator.labelEn ? (
            <div className="macro-kpi-label-en" title={indicator.labelEn}>
              {indicator.labelEn}
            </div>
          ) : null}
          <div className="macro-kpi-category">
            {categoryLabel(indicator.category)}
          </div>
        </div>
        <Sparkline
          points={indicator.history}
          trend={indicator.trend}
          ariaLabel={`${indicator.label} trend grafiği`}
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

      <dl className="macro-kpi-explainer">
        <dt>Nedir?</dt>
        <dd>{indicator.whatItIs}</dd>
        <dt>Nasıl yorumlanır?</dt>
        <dd>{indicator.howToInterpret}</dd>
      </dl>

      <FreshnessBadge
        source={indicator.source}
        updatedAt={indicator.updatedAt}
        compact
      />
    </article>
  );
}
