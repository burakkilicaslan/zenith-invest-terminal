import { StateSwitcher } from "@/components/dashboard/StateSwitcher";
import { FreshnessBadge } from "@/components/macro/FreshnessBadge";
import { MacroCalendarPanel } from "@/components/macro/MacroCalendarPanel";
import { MacroKpiGrid } from "@/components/macro/MacroKpiGrid";
import { MacroSignalsPanel } from "@/components/macro/MacroSignalsPanel";
import { MacroThemesPanel } from "@/components/macro/MacroThemesPanel";
import { MacroTrendCharts } from "@/components/macro/MacroTrendCharts";
import { RegionSwitcher } from "@/components/macro/RegionSwitcher";
import { YieldCurvePanel } from "@/components/macro/YieldCurvePanel";
import { emptyMacroDashboard, mockMacroDashboard } from "@/lib/mocks/macro";
import {
  isDashboardState,
  isMacroRegion,
  type DashboardState,
  type MacroRegion,
} from "@/lib/types";

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function resolveState(raw: string | string[] | undefined): DashboardState {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return isDashboardState(candidate) ? candidate : "populated";
}

function resolveRegion(raw: string | string[] | undefined): MacroRegion {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return isMacroRegion(candidate) ? candidate : "us";
}

function regionLabel(region: MacroRegion): string {
  return region === "us" ? "United States" : "Türkiye";
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const state = resolveState(params.state);
  const region = resolveRegion(params.region);
  const dashboard = state === "empty" ? emptyMacroDashboard : mockMacroDashboard;

  const regionSnapshot =
    dashboard.regions.find((r) => r.region === region) ?? {
      region,
      asOf: dashboard.generatedAt,
      indicators: [],
    };
  const regionSignals = dashboard.signals.filter(
    (s) => s.region === region || s.region === null,
  );
  const regionThemes = dashboard.themes.filter(
    (t) => t.region === region || t.region === null,
  );
  const regionCalendar = dashboard.calendar.filter((e) => e.region === region);
  const yieldCurve =
    dashboard.yieldCurves.find((c) => c.country === region) ?? null;

  return (
    <main>
      <header className="macro-header">
        <div className="macro-header-top">
          <div>
            <h1 className="macro-title">Macro Strategy Dashboard</h1>
            <p className="macro-subtitle">
              US &amp; Türkiye macro indicators — mock-driven, no live data yet.
            </p>
          </div>
          <FreshnessBadge
            source={dashboard.source}
            updatedAt={regionSnapshot.asOf}
          />
        </div>

        <div className="macro-header-controls">
          <RegionSwitcher current={region} state={state} />
          <StateSwitcher current={state} region={region} />
        </div>
      </header>

      <section className="card full-width" aria-labelledby="macro-kpi-heading">
        <h2 id="macro-kpi-heading">
          {regionLabel(region)} macro indicators
        </h2>
        <MacroKpiGrid indicators={regionSnapshot.indicators} state={state} />
      </section>

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="yield-curve-heading">
          <h2 id="yield-curve-heading">Yield curve &amp; 10Y–2Y spread</h2>
          <YieldCurvePanel snapshot={yieldCurve} state={state} />
        </section>

        <section className="card" aria-labelledby="signals-heading">
          <h2 id="signals-heading">Macro signal summary</h2>
          <MacroSignalsPanel
            signals={regionSignals}
            indicators={regionSnapshot.indicators}
            state={state}
          />
        </section>

        <section
          className="card full-width"
          aria-labelledby="trend-charts-heading"
        >
          <h2 id="trend-charts-heading">Macro trend charts</h2>
          <MacroTrendCharts
            indicators={regionSnapshot.indicators}
            state={state}
          />
        </section>

        <section className="card" aria-labelledby="themes-heading">
          <h2 id="themes-heading">Macro themes &amp; watchlists</h2>
          <MacroThemesPanel
            themes={regionThemes}
            indicators={regionSnapshot.indicators}
            state={state}
          />
        </section>

        <section className="card" aria-labelledby="calendar-heading">
          <h2 id="calendar-heading">Macro calendar</h2>
          <MacroCalendarPanel events={regionCalendar} state={state} />
        </section>
      </div>

    </main>
  );
}
