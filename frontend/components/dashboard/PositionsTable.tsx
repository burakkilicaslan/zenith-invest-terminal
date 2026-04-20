import type { AssetPosition, DashboardState } from "@/lib/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/format";

import { SectionStateView } from "./SectionState";

interface Props {
  positions: AssetPosition[];
  state?: DashboardState;
}

export function PositionsTable({ positions, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && positions.length === 0 ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={5}
      emptyMessage="No positions to display."
      errorMessage="Couldn't load positions."
    >
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Class</th>
            <th className="num">Qty</th>
            <th className="num">Price</th>
            <th className="num">Market value</th>
            <th className="num">Unrealized P&amp;L</th>
            <th className="num">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const pnlClass =
              p.unrealizedPnL > 0
                ? "positive"
                : p.unrealizedPnL < 0
                  ? "negative"
                  : "neutral";
            return (
              <tr key={p.symbol}>
                <td>
                  <strong>{p.symbol}</strong>
                </td>
                <td>{p.name}</td>
                <td>{p.assetClass}</td>
                <td className="num">{formatNumber(p.quantity)}</td>
                <td className="num">{formatCurrency(p.marketPrice)}</td>
                <td className="num">{formatCurrency(p.marketValue)}</td>
                <td className={`num ${pnlClass}`}>
                  {formatCurrency(p.unrealizedPnL)} (
                  {formatPercent(p.unrealizedPnLPercent)})
                </td>
                <td className="num">{formatPercent(p.allocationPercent)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </SectionStateView>
  );
}
