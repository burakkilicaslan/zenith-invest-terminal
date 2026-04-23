/**
 * Regenerates the top-of-dashboard AI "is this an investable
 * environment?" summary from the indicator values that were actually
 * resolved this cycle.
 *
 * The mock `aiSummary` baked into `lib/mocks/macro.ts` is a hand-
 * written narrative that quotes specific numbers (VIX 17,4, etc.).
 * When the orchestrator swaps in live values for the same indicators
 * but leaves the summary block untouched, the headline verdict and
 * bullets lie to the reader: the KPI tiles read 4,32 while the
 * summary keeps saying 4,28, and the chip strip says `canlı` while
 * the summary cites stale mock numbers.
 *
 * This module produces a deterministic, rule-based synthesis over the
 * resolved indicator set. It is intentionally small and explicit —
 * every sentence is derived from a single indicator's value or a
 * direct comparison between two indicators, so reviewers can audit
 * the narrative by reading the code.
 *
 * Scope (Epic 2 / issue #32): commentary is **US-only**. Türkiye
 * indicators still render on the dashboard via the region filter,
 * but they are deliberately excluded from the AI narrative, verdict,
 * highlights and risks so the summary reflects a single market.
 */

import type {
  InvestabilityVerdict,
  MacroAiSummary,
  MacroIndicator,
  MacroRegionSnapshot,
  ProviderMode,
} from "../types";

type MaybeIndicator = MacroIndicator | undefined;

interface IndicatorLookup {
  byId(id: string): MaybeIndicator;
  /** Whether any indicator was served from a live or cached provider. */
  anyLive(): boolean;
}

function buildLookup(regions: MacroRegionSnapshot[]): IndicatorLookup {
  const map = new Map<string, MacroIndicator>();
  let anyLive = false;
  for (const region of regions) {
    for (const indicator of region.indicators) {
      map.set(indicator.id, indicator);
      const mode = indicator.provenance?.mode;
      if (mode === "live" || mode === "cached") {
        anyLive = true;
      }
    }
  }
  return {
    byId: (id) => map.get(id),
    anyLive: () => anyLive,
  };
}

/** Turkish-localized numeric formatter. */
function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatBps(percent: number): string {
  // `percent` is in percentage points (e.g. -0.14 for -14 bps).
  const bps = Math.round(percent * 100);
  const sign = bps > 0 ? "+" : "";
  return `${sign}${bps} bp`;
}

function formatTrillions(value: number): string {
  return `${formatNumber(value, 2)} T$`;
}

/**
 * Public entry point.
 *
 * When no indicator was resolved from a live/cached source, returns
 * the caller-supplied fallback (typically the deterministic mock
 * summary) unchanged. Otherwise, rebuilds `headline`, `verdict`,
 * `narrative`, `highlights`, `risks`, `confidence`, `model`, and
 * `generatedAt` from the resolved **US** indicator values.
 */
export function deriveAiSummary(
  regions: MacroRegionSnapshot[],
  fallback: MacroAiSummary | null,
  overallMode: ProviderMode | "mixed",
): MacroAiSummary | null {
  if (!fallback) return fallback;
  const lookup = buildLookup(regions);
  if (!lookup.anyLive()) {
    // Fully-mock resolution — keep the deterministic mock narrative.
    return fallback;
  }

  const highlights: string[] = [];
  const risks: string[] = [];

  // US yield curve ------------------------------------------------------
  const spread = lookup.byId("us-10y-2y");
  if (spread) {
    const bps = formatBps(spread.value);
    if (spread.value < 0) {
      risks.push(
        `ABD 10Y–2Y eğrisi ${bps} ile negatif; resesyon öncü sinyali hâlâ canlı.`,
      );
    } else if (spread.value < 0.25) {
      risks.push(
        `ABD 10Y–2Y eğrisi ${bps} ile sıfır çevresinde; büyüme sinyali zayıf.`,
      );
    } else {
      highlights.push(
        `ABD 10Y–2Y eğrisi ${bps} ile pozitif; büyüme beklentileri destekleniyor.`,
      );
    }
  }

  // US volatility -------------------------------------------------------
  const vix = lookup.byId("us-vix");
  if (vix) {
    const vixText = formatNumber(vix.value, 1);
    if (vix.value >= 25) {
      risks.push(`VIX ${vixText} ile stres bölgesinde; hedge talebi yüksek.`);
    } else if (vix.value >= 20) {
      risks.push(`VIX ${vixText} ile temkinli bölgeye geçti.`);
    } else {
      highlights.push(`VIX ${vixText} ile sakin bölgede; risk iştahı koruyor.`);
    }
  }

  // US liquidity --------------------------------------------------------
  const fedBs = lookup.byId("us-fed-bs");
  if (fedBs) {
    const bsText = formatTrillions(fedBs.value);
    if (fedBs.trend === "down") {
      risks.push(`Fed bilançosu ${bsText} seviyesinde küçülmeye devam ediyor.`);
    } else if (fedBs.trend === "up") {
      highlights.push(
        `Fed bilançosu ${bsText} seviyesinde genişliyor; likidite destekleyici.`,
      );
    }
  }

  // US sentiment --------------------------------------------------------
  const fearGreed = lookup.byId("us-fear-greed");
  if (fearGreed) {
    const fgText = formatNumber(fearGreed.value, 0);
    if (fearGreed.value >= 75) {
      risks.push(
        `CNN Korku & Hırs endeksi ${fgText} — aşırı hırs, kontra sinyal.`,
      );
    } else if (fearGreed.value >= 55) {
      highlights.push(`CNN Korku & Hırs endeksi ${fgText} — hırs bölgesi.`);
    } else if (fearGreed.value <= 25) {
      highlights.push(
        `CNN Korku & Hırs endeksi ${fgText} — aşırı korku, tarihsel olarak taban sinyali.`,
      );
    }
  }

  const canSlim = lookup.byId("us-canslim-exposure");
  if (canSlim) {
    const csText = formatNumber(canSlim.value, 0);
    if (canSlim.value >= 60) {
      highlights.push(
        `CAN SLIM tavsiye ağırlığı %${csText} ile 'confirmed uptrend' bölgesinde.`,
      );
    } else if (canSlim.value <= 20) {
      risks.push(
        `CAN SLIM tavsiye ağırlığı %${csText} ile savunmaya çekilmiş.`,
      );
    }
  }

  // ---------- Verdict + narrative ----------
  const verdict = resolveVerdict(highlights.length, risks.length);
  const headline = HEADLINE[verdict];
  const narrative = buildNarrative(verdict, lookup);

  // Confidence scales with (a) live coverage and (b) how one-sided
  // the signal mix is. Cap at 0.75 because this is still a
  // rule-based synthesis, not a real model.
  const totalSignals = highlights.length + risks.length;
  const dominance =
    totalSignals === 0
      ? 0
      : Math.abs(highlights.length - risks.length) / totalSignals;
  const coverage = Math.min(1, totalSignals / 5);
  const confidence = Math.max(
    0.4,
    Math.min(0.75, 0.45 + 0.2 * coverage + 0.1 * dominance),
  );

  return {
    ...fallback,
    generatedAt: new Date().toISOString(),
    verdict,
    headline,
    narrative,
    highlights,
    risks,
    confidence: Number(confidence.toFixed(2)),
    model: MODEL_LABEL[overallMode] ?? fallback.model,
  };
}

const HEADLINE: Record<InvestabilityVerdict, string> = {
  favorable: "Yatırım ortamı destekleyici",
  cautious: "Seçici yatırım ortamı",
  unfavorable: "Yatırım ortamı baskı altında",
  mixed: "Karışık makro sinyalleri",
};

const MODEL_LABEL: Record<ProviderMode | "mixed", string> = {
  live: "canlı: kural tabanlı sentez (ABD)",
  mixed: "karma: kural tabanlı sentez (ABD)",
  cached: "önbellek: kural tabanlı sentez (ABD)",
  mock: "mock: kural tabanlı sentez (ABD)",
};

const NARRATIVE_PREAMBLE: Record<InvestabilityVerdict, string> = {
  favorable:
    "ABD canlı göstergeleri destekleyici bir makro ortama işaret ediyor.",
  cautious:
    "ABD canlı göstergeleri dengeli bir tablo ortaya koyuyor; seçici pozisyonlanma uygun.",
  unfavorable:
    "ABD canlı göstergeleri baskıcı bir makro ortama işaret ediyor; savunmacı pozisyon ön planda.",
  mixed: "ABD canlı göstergeleri karışık sinyaller üretiyor.",
};

function resolveVerdict(
  highlightCount: number,
  riskCount: number,
): InvestabilityVerdict {
  if (highlightCount === 0 && riskCount === 0) return "mixed";
  if (highlightCount === 0) return "unfavorable";
  if (riskCount === 0) return "favorable";
  if (highlightCount >= riskCount + 2) return "favorable";
  if (riskCount >= highlightCount + 2) return "unfavorable";
  return "cautious";
}

function buildNarrative(
  verdict: InvestabilityVerdict,
  lookup: IndicatorLookup,
): string {
  const parts: string[] = [NARRATIVE_PREAMBLE[verdict]];

  const spread = lookup.byId("us-10y-2y");
  const vix = lookup.byId("us-vix");
  const fedBs = lookup.byId("us-fed-bs");
  if (spread && vix && fedBs) {
    parts.push(
      `10Y–2Y eğrisi ${formatBps(spread.value)}, VIX ${formatNumber(
        vix.value,
        1,
      )} ve Fed bilançosu ${formatTrillions(fedBs.value)} seviyelerinde.`,
    );
  }

  return parts.join(" ");
}
