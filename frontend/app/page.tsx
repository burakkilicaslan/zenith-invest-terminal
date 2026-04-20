import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { MarketSnapshotPanel } from "@/components/dashboard/MarketSnapshotPanel";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { mockDashboard } from "@/lib/mocks/dashboard";

export default function DashboardPage() {
  const dashboard = mockDashboard;

  return (
    <main>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Macro Dashboard</h1>
        <p style={{ color: "var(--text-muted)", margin: "4px 0 0" }}>
          Mock-driven preview — no live data.
        </p>
      </header>

      <div className="summary-strip" style={{ marginBottom: 16 }}>
        <SummaryStrip summary={dashboard.summary} />
      </div>

      <div className="dashboard-grid">
        <section className="card full-width">
          <h2>Positions</h2>
          <PositionsTable positions={dashboard.positions} />
        </section>

        <section className="card">
          <h2>Market snapshot</h2>
          <MarketSnapshotPanel items={dashboard.marketSnapshot} />
        </section>

        <section className="card">
          <h2>Insights</h2>
          <InsightsPanel items={dashboard.insights} />
        </section>

        <section className="card full-width">
          <h2>Recent activity</h2>
          <ActivityTimeline items={dashboard.activity} />
        </section>
      </div>
    </main>
  );
}
