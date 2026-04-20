import type {
  DashboardState,
  InvestabilityVerdict,
  MacroAiSummary,
} from "@/lib/types";
import { formatDateTime } from "@/lib/format";

import { SectionStateView } from "../dashboard/SectionState";

interface Props {
  summary: MacroAiSummary | null;
  state?: DashboardState;
}

const VERDICT_LABEL: Record<InvestabilityVerdict, string> = {
  favorable: "Yatırıma uygun ortam",
  cautious: "Temkinli / seçici ortam",
  unfavorable: "Yatırıma uygun değil",
  mixed: "Karışık sinyaller",
};

const VERDICT_CLASS: Record<InvestabilityVerdict, string> = {
  favorable: "verdict-favorable",
  cautious: "verdict-cautious",
  unfavorable: "verdict-unfavorable",
  mixed: "verdict-mixed",
};

/**
 * Top-of-dashboard AI summary panel answering the product question
 * "is the current macro backdrop an investable environment?".
 *
 * Everything surfaced here is mock-driven: the narrative is a
 * rule-based synthesis over the mocked indicator set. Source
 * attributions are rendered next to the verdict so reviewers can
 * audit the inputs.
 */
export function MacroAiSummaryPanel({ summary, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && !summary ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={4}
      emptyMessage="Henüz AI makro değerlendirmesi yok."
      errorMessage="AI makro değerlendirmesi yüklenemedi."
    >
      {summary ? <AiSummaryBody summary={summary} /> : null}
    </SectionStateView>
  );
}

function AiSummaryBody({ summary }: { summary: MacroAiSummary }) {
  const confidencePct = Math.round(summary.confidence * 100);

  return (
    <div className="ai-summary">
      <header className="ai-summary-head">
        <div>
          <span
            className={`ai-summary-verdict ${VERDICT_CLASS[summary.verdict]}`}
          >
            {VERDICT_LABEL[summary.verdict]}
          </span>
          <h3 className="ai-summary-headline">{summary.headline}</h3>
        </div>
        <div className="ai-summary-meta">
          <span className="ai-summary-confidence">
            Güven %{confidencePct}
          </span>
          <span className="ai-summary-model">{summary.model}</span>
          <span className="ai-summary-updated">
            {formatDateTime(summary.generatedAt)}
          </span>
        </div>
      </header>

      <p className="ai-summary-narrative">{summary.narrative}</p>

      <div className="ai-summary-lists">
        {summary.highlights.length > 0 ? (
          <div className="ai-summary-list ai-summary-highlights">
            <h4>Destekleyici unsurlar</h4>
            <ul>
              {summary.highlights.map((item, idx) => (
                <li key={`h-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {summary.risks.length > 0 ? (
          <div className="ai-summary-list ai-summary-risks">
            <h4>İzlenmesi gereken riskler</h4>
            <ul>
              {summary.risks.map((item, idx) => (
                <li key={`r-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {summary.sources.length > 0 ? (
        <div className="ai-summary-sources">
          <span className="ai-summary-sources-label">Kaynaklar:</span>
          <ul>
            {summary.sources.map((source) => (
              <li key={source.code} className="ai-summary-source">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={source.label}
                  >
                    {source.code}
                  </a>
                ) : (
                  <span title={source.label}>{source.code}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="ai-summary-disclaimer">
        Bu değerlendirme mock verilerden üretilmiştir, yatırım tavsiyesi
        değildir.
      </p>
    </div>
  );
}
