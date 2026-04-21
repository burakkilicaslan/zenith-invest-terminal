import type { DataSource, ProviderMode } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface Props {
  source: DataSource;
  updatedAt: string;
  /** Shown at smaller scale for in-card placement. */
  compact?: boolean;
  /**
   * Provenance mode for the observation. Controls the dot color and
   * adds a small suffix chip when the value is not live.
   */
  mode?: ProviderMode;
  /** Optional reason shown as a suffix chip when `mode !== "live"`. */
  fallbackReason?: string | null;
}

const MODE_LABEL: Record<ProviderMode, string | null> = {
  live: null,
  cached: "önbellek",
  mock: "mock",
};

/**
 * Source + last-updated badge. Used on the page header for the whole
 * snapshot, and on individual cards to show per-indicator freshness.
 *
 * The source label links to the upstream series when a URL is known so
 * reviewers can audit the data point directly. When a `mode` is
 * provided, the dot color reflects the resolution mode (live / cached
 * / mock) so degraded indicators are visually distinct.
 */
export function FreshnessBadge({
  source,
  updatedAt,
  compact = false,
  mode = "mock",
  fallbackReason = null,
}: Props) {
  const tooltipParts = [
    `Kaynak: ${source.label}`,
    `Güncelleme: ${formatDateTime(updatedAt)}`,
  ];
  if (mode !== "live") {
    tooltipParts.push(`Mod: ${MODE_LABEL[mode] ?? mode}`);
  }
  if (fallbackReason) {
    tooltipParts.push(`Neden: ${fallbackReason}`);
  }
  const modeSuffix = MODE_LABEL[mode];

  return (
    <span
      className={[
        "freshness-badge",
        compact ? "is-compact" : "",
        `is-mode-${mode}`,
      ]
        .filter(Boolean)
        .join(" ")}
      title={tooltipParts.join(" · ")}
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
      {modeSuffix ? (
        <span className="freshness-badge-mode" aria-label={`Veri modu: ${modeSuffix}`}>
          {modeSuffix}
        </span>
      ) : null}
    </span>
  );
}
