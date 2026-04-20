import type { DashboardState, YieldCurveSnapshot } from "@/lib/types";
import { formatDateTime, formatSigned } from "@/lib/format";

import { SectionStateView } from "../dashboard/SectionState";
import { FreshnessBadge } from "./FreshnessBadge";

interface Props {
  snapshot: YieldCurveSnapshot | null;
  state?: DashboardState;
}

const CHART_WIDTH = 360;
const CHART_HEIGHT = 140;
const CHART_PADDING = { top: 12, right: 12, bottom: 24, left: 36 };

const SLOPE_LABEL: Record<YieldCurveSnapshot["slopeTrend"], string> = {
  up: "pozitif eğim",
  down: "tersine dönmüş",
  flat: "düzleşmiş",
};

/**
 * Yield curve + 10Y/2Y spread visualization. Renders the full tenor
 * curve when provided, otherwise falls back to a compact 2Y/10Y
 * summary. SVG-based so no chart library is required.
 */
export function YieldCurvePanel({ snapshot, state = "populated" }: Props) {
  const resolvedState: DashboardState =
    state === "populated" && !snapshot ? "empty" : state;

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={4}
      emptyMessage="Getiri eğrisi verisi yok."
      errorMessage="Getiri eğrisi yüklenemedi."
    >
      {snapshot ? <YieldCurveBody snapshot={snapshot} /> : null}
    </SectionStateView>
  );
}

function YieldCurveBody({ snapshot }: { snapshot: YieldCurveSnapshot }) {
  const spreadBps = Math.round(snapshot.spread * 100);
  const spreadClass =
    snapshot.spread > 0
      ? "positive"
      : snapshot.spread < 0
        ? "negative"
        : "neutral";

  const slopeClass =
    snapshot.slopeTrend === "up"
      ? "positive"
      : snapshot.slopeTrend === "down"
        ? "negative"
        : "neutral";

  const tenors = snapshot.tenors ?? [];
  const hasCurve = tenors.length >= 2;

  return (
    <div className="yield-curve-panel">
      <div className="yield-curve-summary">
        <div>
          <div className="yield-curve-label">2 Yıl</div>
          <div className="yield-curve-value">
            %{snapshot.twoYearYield.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="yield-curve-label">10 Yıl</div>
          <div className="yield-curve-value">
            %{snapshot.tenYearYield.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="yield-curve-label">10Y–2Y fark</div>
          <div className={`yield-curve-value ${spreadClass}`}>
            {formatSigned(snapshot.spread, 2)} pp ({formatSigned(spreadBps, 0)}{" "}
            bp)
          </div>
        </div>
        <div>
          <div className="yield-curve-label">Eğim</div>
          <div className={`yield-curve-value ${slopeClass}`}>
            {SLOPE_LABEL[snapshot.slopeTrend]}
          </div>
        </div>
      </div>

      {hasCurve ? (
        <CurveChart tenors={tenors} />
      ) : (
        <p className="yield-curve-fallback">
          Tüm vadeler mevcut değil — yalnızca 2Y/10Y özeti gösteriliyor.
        </p>
      )}

      {snapshot.interpretation ? (
        <p className="yield-curve-interpretation">{snapshot.interpretation}</p>
      ) : null}

      <div className="yield-curve-footer">
        <FreshnessBadge
          source={snapshot.source}
          updatedAt={snapshot.updatedAt}
          compact
        />
        <span className="yield-curve-updated">
          Güncelleme {formatDateTime(snapshot.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function CurveChart({
  tenors,
}: {
  tenors: NonNullable<YieldCurveSnapshot["tenors"]>;
}) {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  const { top, right, bottom, left } = CHART_PADDING;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const sorted = [...tenors].sort((a, b) => a.tenorYears - b.tenorYears);
  const xs = sorted.map((t) => Math.log1p(t.tenorYears));
  const ys = sorted.map((t) => t.yield);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const rangeX = maxX - minX || 1;
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;

  const scaleX = (x: number) => left + ((x - minX) / rangeX) * plotWidth;
  const scaleY = (y: number) =>
    top + plotHeight - ((y - minY) / rangeY) * plotHeight;

  const path = sorted
    .map((t, i) => {
      const x = scaleX(xs[i]).toFixed(2);
      const y = scaleY(t.yield).toFixed(2);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="yield-curve-chart"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Vadelere göre getiri eğrisi"
    >
      <rect
        x={left}
        y={top}
        width={plotWidth}
        height={plotHeight}
        fill="transparent"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={1.75} />
      {sorted.map((t, i) => {
        const cx = scaleX(xs[i]);
        const cy = scaleY(t.yield);
        return (
          <g key={t.tenor}>
            <circle cx={cx} cy={cy} r={2.5} fill="var(--accent)" />
            <text
              x={cx}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-muted)"
            >
              {t.tenor}
            </text>
          </g>
        );
      })}
      <text x={4} y={top + 10} fontSize={10} fill="var(--text-muted)">
        %{maxY.toFixed(2)}
      </text>
      <text
        x={4}
        y={top + plotHeight}
        fontSize={10}
        fill="var(--text-muted)"
      >
        %{minY.toFixed(2)}
      </text>
    </svg>
  );
}
