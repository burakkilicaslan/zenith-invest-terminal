import { StateSwitcher } from "@/components/dashboard/StateSwitcher";
import { MacroAiSummaryPanel } from "@/components/macro/MacroAiSummaryPanel";
import { MacroCalendarPanel } from "@/components/macro/MacroCalendarPanel";
import { MacroKpiGrid } from "@/components/macro/MacroKpiGrid";
import { MacroSignalsPanel } from "@/components/macro/MacroSignalsPanel";
import { MacroThemesPanel } from "@/components/macro/MacroThemesPanel";
import { MacroTrendCharts } from "@/components/macro/MacroTrendCharts";
import { ProviderStatusBar } from "@/components/macro/ProviderStatusBar";
import { RegionSwitcher } from "@/components/macro/RegionSwitcher";
import { YieldCurvePanel } from "@/components/macro/YieldCurvePanel";
import { getMacroDashboard } from "@/lib/live";
import { formatDateTime } from "@/lib/format";
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
  return region === "us" ? "ABD" : "Türkiye";
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const state = resolveState(params.state);
  const region = resolveRegion(params.region);
  const dashboard = await getMacroDashboard({ state });
  const dashboardMode = dashboard.mode ?? "mock";

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
            <h1 className="macro-title">Makro Strateji Panosu</h1>
            <p className="macro-subtitle">
              ABD ve Türkiye için makro göstergeler — canlı sağlayıcılar
              (FRED, FMP, Polygon, TCMB) bağlanabildiğinde değerler canlı
              okunur, aksi halde mock değerlere geri düşer.
            </p>
          </div>
          <div className="macro-header-meta">
            <span className="macro-header-source-pill" title="Veri kaynağı">
              Kaynak: {dashboard.source}
            </span>
            <span className="macro-header-updated">
              Üretilme {formatDateTime(dashboard.generatedAt)}
            </span>
          </div>
        </div>

        <div className="macro-header-controls">
          <RegionSwitcher current={region} state={state} />
          <StateSwitcher current={state} region={region} />
        </div>

        <ProviderStatusBar
          mode={dashboardMode}
          providers={dashboard.providerStatus ?? []}
        />
      </header>

      <section
        className="card full-width"
        aria-labelledby="ai-summary-heading"
      >
        <h2 id="ai-summary-heading">
          Yatırıma uygun bir ortam mı? (AI özeti)
        </h2>
        <MacroAiSummaryPanel summary={dashboard.aiSummary} state={state} />
      </section>

      <section className="card full-width" aria-labelledby="macro-kpi-heading">
        <h2 id="macro-kpi-heading">
          {regionLabel(region)} makro göstergeleri
        </h2>
        <MacroKpiGrid indicators={regionSnapshot.indicators} state={state} />
      </section>

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="yield-curve-heading">
          <h2 id="yield-curve-heading">
            Getiri eğrisi ve 10Y–2Y farkı
          </h2>
          <YieldCurvePanel snapshot={yieldCurve} state={state} />
        </section>

        <section className="card" aria-labelledby="signals-heading">
          <h2 id="signals-heading">Makro sinyal özeti</h2>
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
          <h2 id="trend-charts-heading">Makro trend grafikleri</h2>
          <MacroTrendCharts
            indicators={regionSnapshot.indicators}
            state={state}
          />
        </section>

        <section className="card" aria-labelledby="themes-heading">
          <h2 id="themes-heading">Makro temalar ve izleme listeleri</h2>
          <MacroThemesPanel
            themes={regionThemes}
            indicators={regionSnapshot.indicators}
            state={state}
          />
        </section>

        <section className="card" aria-labelledby="calendar-heading">
          <h2 id="calendar-heading">Makro takvim</h2>
          <MacroCalendarPanel events={regionCalendar} state={state} />
        </section>
      </div>
    </main>
  );
}
