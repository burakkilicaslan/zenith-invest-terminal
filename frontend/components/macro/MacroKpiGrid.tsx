import type { DashboardState, MacroIndicator } from "@/lib/types";

import { MacroKpiCard } from "./MacroKpiCard";
import { SectionStateView } from "../dashboard/SectionState";

interface Props {
  indicators: MacroIndicator[];
  state?: DashboardState;
}

export function MacroKpiGrid({ indicators, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && indicators.length === 0 ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={4}
      emptyMessage="No macro indicators for this region yet."
      errorMessage="Couldn't load macro indicators."
    >
      <div className="macro-kpi-grid">
        {indicators.map((indicator) => (
          <MacroKpiCard key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </SectionStateView>
  );
}
