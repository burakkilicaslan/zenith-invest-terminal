import type { InsightCard } from "@/lib/types";

interface Props {
  items: InsightCard[];
}

export function InsightsPanel({ items }: Props) {
  if (items.length === 0) {
    return <div className="state-empty">No insights available.</div>;
  }

  return (
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
  );
}
