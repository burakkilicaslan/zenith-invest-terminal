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

const IMPACT_LABEL: Record<MacroCalendarItem["expectedImpact"], string> = {
  low: "düşük etki",
  medium: "orta etki",
  high: "yüksek etki",
};

const REGION_LABEL: Record<MacroCalendarItem["region"], string> = {
  us: "ABD",
  tr: "TR",
};

function formatFieldValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value !== "number") {
    return value;
  }
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
      emptyMessage="Planlanmış makro takvim verisi yok."
      errorMessage="Makro takvim yüklenemedi."
    >
      <ul className="calendar-list">
        {sorted.map((event) => (
          <li className="calendar-item" key={event.id}>
            <div className="calendar-item-head">
              <span className="calendar-item-region">
                {REGION_LABEL[event.region]}
              </span>
              <span className="calendar-item-name">{event.eventName}</span>
              <span
                className={`calendar-impact ${IMPACT_CLASS[event.expectedImpact]}`}
              >
                {IMPACT_LABEL[event.expectedImpact]}
              </span>
            </div>
            <div className="calendar-item-meta">
              <span>{formatDateTime(event.scheduledAt)}</span>
              <span>
                · Kaynak:{" "}
                {event.source.url ? (
                  <a
                    className="calendar-source-link"
                    href={event.source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {event.source.code}
                  </a>
                ) : (
                  event.source.code
                )}
              </span>
            </div>
            <div className="calendar-item-values">
              <span>
                <span className="calendar-item-label">Beklenti</span>{" "}
                <span className="calendar-item-number">
                  {formatFieldValue(event.consensus)}
                </span>
              </span>
              <span>
                <span className="calendar-item-label">Gerçekleşen</span>{" "}
                <span className="calendar-item-number">
                  {formatFieldValue(event.actual)}
                </span>
              </span>
              <span>
                <span className="calendar-item-label">Önceki</span>{" "}
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
