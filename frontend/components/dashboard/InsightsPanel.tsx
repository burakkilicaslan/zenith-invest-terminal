import type { DashboardState, InsightCard } from "@/lib/types";

import { SectionStateView } from "./SectionState";

interface Props {
  items: InsightCard[];
  state?: DashboardState;
}

export function InsightsPanel({ items, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && items.length === 0 ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={3}
      emptyMessage="No insights available."
      errorMessage="Couldn't load insights."
    >
      <div className="insight-list">
        {items.map((i) => (
          <div className="insight-item" key={i.id}>
            <div className="title">{i.title}</div>
            <div>{i.summary}</div>
            <div className="meta">
              {i.category} · {i.severity} · confidence{" "}
              {(i.confidence * 100).toFixed(0)}%
              {i.source ? ` · ${i.source}` : ""}
            </div>
          </div>
        ))}
      </div>
    </SectionStateView>
  );
}
