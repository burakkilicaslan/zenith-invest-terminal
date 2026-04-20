import type { DataSource } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface Props {
  source: DataSource;
  updatedAt: string;
  /** Shown at smaller scale for in-card placement. */
  compact?: boolean;
}

/**
 * Source + last-updated badge. Used on the page header for the whole
 * snapshot, and on individual cards to show per-indicator freshness.
 *
 * The source label links to the upstream series when a URL is known so
 * reviewers can audit the data point directly.
 */
export function FreshnessBadge({ source, updatedAt, compact = false }: Props) {
  const tooltip = `Kaynak: ${source.label} · Güncelleme: ${formatDateTime(
    updatedAt,
  )}`;

  return (
    <span
      className={`freshness-badge${compact ? " is-compact" : ""}`}
      title={tooltip}
    >
      <span className="freshness-badge-dot" aria-hidden="true" />
      {source.url ? (
        <a
          className="freshness-badge-source"
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {source.code}
        </a>
      ) : (
        <span className="freshness-badge-source">{source.code}</span>
      )}
      <span className="freshness-badge-separator" aria-hidden="true">
        ·
      </span>
      <span className="freshness-badge-time">
        Güncelleme {formatDateTime(updatedAt)}
      </span>
    </span>
  );
}
