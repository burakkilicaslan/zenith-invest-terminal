import type {
  DashboardState,
  MacroIndicator,
  MacroSignalCard,
} from "@/lib/types";
import { formatDateTime } from "@/lib/format";

import { SectionStateView } from "../dashboard/SectionState";

interface Props {
  signals: MacroSignalCard[];
  indicators: MacroIndicator[];
  state?: DashboardState;
}

const SEVERITY_CLASS: Record<MacroSignalCard["severity"], string> = {
  info: "severity-info",
  watch: "severity-watch",
  warning: "severity-warning",
  critical: "severity-critical",
};

const SEVERITY_LABEL: Record<MacroSignalCard["severity"], string> = {
  info: "bilgi",
  watch: "izlemede",
  warning: "uyarı",
  critical: "kritik",
};

/**
 * Compact macro signal summary. Each card shows severity, confidence
 * and the indicators the signal is derived from.
 */
export function MacroSignalsPanel({
  signals,
  indicators,
  state = "populated",
}: Props) {
  const resolvedState: DashboardState =
    state === "populated" && signals.length === 0 ? "empty" : state;

  const indicatorLookup = new Map(indicators.map((i) => [i.id, i.label]));

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={3}
      emptyMessage="Şu an için sinyal bulunmuyor."
      errorMessage="Makro sinyaller yüklenemedi."
    >
      <div className="signal-list">
        {signals.map((signal) => (
          <article
            key={signal.id}
            className={`signal-item ${SEVERITY_CLASS[signal.severity]}`}
          >
            <header className="signal-head">
              <span className="signal-title">{signal.title}</span>
              <span
                className={`signal-severity-badge ${SEVERITY_CLASS[signal.severity]}`}
              >
                {SEVERITY_LABEL[signal.severity]}
              </span>
            </header>
            <p className="signal-summary">{signal.summary}</p>
            <div className="signal-meta">
              <span>Güven %{(signal.confidence * 100).toFixed(0)}</span>
              <span>
                · Kaynak:{" "}
                {signal.source.url ? (
                  <a
                    className="signal-meta-link"
                    href={signal.source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {signal.source.code}
                  </a>
                ) : (
                  signal.source.code
                )}
              </span>
              <span>· {formatDateTime(signal.updatedAt)}</span>
            </div>
            {signal.relatedIndicators.length > 0 ? (
              <div className="signal-chips">
                {signal.relatedIndicators.map((id) => (
                  <span className="signal-chip" key={id}>
                    {indicatorLookup.get(id) ?? id}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </SectionStateView>
  );
}
