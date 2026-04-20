import { formatDateTime } from "@/lib/format";

interface Props {
  source: string;
  updatedAt: string;
  /** Shown at smaller scale for in-card placement. */
  compact?: boolean;
}

/**
 * Source + last-updated badge. Used on the page header for the whole
 * snapshot, and on individual cards to show per-indicator freshness.
 */
export function FreshnessBadge({ source, updatedAt, compact = false }: Props) {
  return (
    <span
      className={`freshness-badge${compact ? " is-compact" : ""}`}
      title={`Source: ${source} · Updated ${formatDateTime(updatedAt)}`}
    >
      <span className="freshness-badge-dot" aria-hidden="true" />
      <span className="freshness-badge-source">{source}</span>
      <span className="freshness-badge-separator" aria-hidden="true">
        ·
      </span>
      <span className="freshness-badge-time">
        Updated {formatDateTime(updatedAt)}
      </span>
    </span>
  );
}
