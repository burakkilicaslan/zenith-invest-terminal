import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { MarketSnapshotPanel } from "@/components/dashboard/MarketSnapshotPanel";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { StateSwitcher } from "@/components/dashboard/StateSwitcher";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { emptyDashboard, mockDashboard } from "@/lib/mocks/dashboard";
import { isDashboardState, type DashboardState } from "@/lib/types";

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function resolveState(
  raw: string | string[] | undefined,
): DashboardState {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return isDashboardState(candidate) ? candidate : "populated";
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const state = resolveState(params.state);
  const dashboard = state === "empty" ? emptyDashboard : mockDashboard;

  return (
    <main>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Macro Dashboard</h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0" }}>
          Mock-driven preview — no live data.
        </p>
        <StateSwitcher current={state} />
      </header>

      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <SummaryStrip
          summary={state === "empty" ? null : dashboard.summary}
          state={state}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card full-width">
          <h2>Positions</h2>
          <PositionsTable positions={dashboard.positions} state={state} />
        </section>

        <section className="card">
          <h2>Market snapshot</h2>
          <MarketSnapshotPanel
            items={dashboard.marketSnapshot}
            state={state}
          />
        </section>

        <section className="card">
          <h2>Insights</h2>
          <InsightsPanel items={dashboard.insights} state={state} />
        </section>

        <section className="card full-width">
          <h2>Recent activity</h2>
          <ActivityTimeline items={dashboard.activity} state={state} />
        </section>
      </div>
    </main>
  );
}
