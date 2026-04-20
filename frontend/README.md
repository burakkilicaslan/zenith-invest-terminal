# Frontend — Macro Dashboard UI skeleton (Epic 1.3)

Next.js 15 + TypeScript skeleton for the Macro Dashboard. Mock-first:
every section renders from typed fixtures in `lib/mocks/` and consumes
only the shared domain shapes defined in Epic 1.1.

## Structure

- `app/` — App Router entrypoint. `app/page.tsx` is the dashboard.
- `components/dashboard/` — one component per dashboard section:
  - `SummaryStrip` — portfolio value + daily performance.
  - `PositionsTable` — positions.
  - `MarketSnapshotPanel` — market snapshot / trend panel.
  - `InsightsPanel` — insight cards / signal feed.
  - `ActivityTimeline` — recent activity.
- `lib/types.ts` — frontend-local mirror of the domain shapes.
- `lib/mocks/dashboard.ts` — deterministic mock payload.
- `lib/format.ts` — UI-only number and date formatters.

## UI states

Each section handles **empty**, **loading**, **populated**, and
**error** states. `loading` is modeled as the absence of resolved data
at the page level; the current skeleton renders the populated state
from mocks and shows the empty state when given an empty array.

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
```
