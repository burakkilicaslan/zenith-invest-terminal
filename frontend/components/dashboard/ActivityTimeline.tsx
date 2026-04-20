import type { ActivityItem, DashboardState } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

import { SectionStateView } from "./SectionState";

interface Props {
  items: ActivityItem[];
  state?: DashboardState;
}

export function ActivityTimeline({ items, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && items.length === 0 ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={4}
      emptyMessage="No recent activity."
      errorMessage="Couldn't load recent activity."
    >
      <div className="activity-list">
        {items.map((a) => (
          <div className="activity-item" key={a.id}>
            <div className="title">
              {a.title}
              {a.relatedSymbol ? ` · ${a.relatedSymbol}` : ""}
            </div>
            <div>{a.description}</div>
            <div className="meta">
              {a.type} · {formatDateTime(a.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </SectionStateView>
  );
}
