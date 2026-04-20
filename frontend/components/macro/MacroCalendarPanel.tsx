import type { DashboardState, MacroCalendarItem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

import { SectionStateView } from "../dashboard/SectionState";

interface Props {
  events: MacroCalendarItem[];
  state?: DashboardState;
}

const IMPACT_CLASS: Record<MacroCalendarItem["expectedImpact"], string> = {
  low: "impact-low",
  medium: "impact-medium",
  high: "impact-high",
};

function formatFieldValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return typeof value === "number" ? value.toFixed(2) : value;
}

/**
 * Upcoming macro events / calendar panel. Sorted chronologically.
 */
export function MacroCalendarPanel({ events, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && events.length === 0 ? "empty" : state;

  const sorted = [...events].sort(
    (a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt),
  );

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={4}
      emptyMessage="No macro events scheduled."
      errorMessage="Couldn't load the macro calendar."
    >
      <ul className="calendar-list">
        {sorted.map((event) => (
          <li className="calendar-item" key={event.id}>
            <div className="calendar-item-head">
              <span className="calendar-item-region">
                {event.region.toUpperCase()}
              </span>
              <span className="calendar-item-name">{event.eventName}</span>
              <span
                className={`calendar-impact ${IMPACT_CLASS[event.expectedImpact]}`}
              >
                {event.expectedImpact}
              </span>
            </div>
            <div className="calendar-item-meta">
              <span>{formatDateTime(event.scheduledAt)}</span>
              <span>· {event.source}</span>
            </div>
            <div className="calendar-item-values">
              <span>
                <span className="calendar-item-label">Consensus</span>{" "}
                <span className="calendar-item-number">
                  {formatFieldValue(event.consensus)}
                </span>
              </span>
              <span>
                <span className="calendar-item-label">Actual</span>{" "}
                <span className="calendar-item-number">
                  {formatFieldValue(event.actual)}
                </span>
              </span>
              <span>
                <span className="calendar-item-label">Previous</span>{" "}
                <span className="calendar-item-number">
                  {formatFieldValue(event.previous)}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </SectionStateView>
  );
}
