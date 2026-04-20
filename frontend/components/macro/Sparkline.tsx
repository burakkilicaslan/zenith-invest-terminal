import type { MacroTimeSeriesPoint, TrendDirection } from "@/lib/types";

interface Props {
  points: MacroTimeSeriesPoint[];
  trend?: TrendDirection;
  width?: number;
  height?: number;
  ariaLabel?: string;
}

/**
 * Tiny inline-SVG sparkline used inside KPI cards and trend charts.
 * Purely presentational; takes numeric history and renders a polyline.
 */
export function Sparkline({
  points,
  trend = "flat",
  width = 120,
  height = 32,
  ariaLabel,
}: Props) {
  if (points.length < 2) {
    return (
      <svg
        className="sparkline"
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel ?? "No trend data"}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p.value - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const color =
    trend === "up"
      ? "var(--positive)"
      : trend === "down"
        ? "var(--negative)"
        : "var(--neutral)";

  const lastX = (points.length - 1) * stepX;
  const lastY = height - ((values[values.length - 1] - min) / range) * height;

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel ?? "Trend sparkline"}
    >
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={lastX} cy={lastY} r={2.2} fill={color} />
    </svg>
  );
}
