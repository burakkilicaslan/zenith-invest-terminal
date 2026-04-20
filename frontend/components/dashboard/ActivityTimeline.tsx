import type { ActivityItem } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface Props {
  items: ActivityItem[];
}

export function ActivityTimeline({ items }: Props) {
  if (items.length === 0) {
    return <div className="state-empty">No recent activity.</div>;
  }

  return (
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
  );
}
