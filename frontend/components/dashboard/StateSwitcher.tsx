import Link from "next/link";

import type { DashboardState } from "@/lib/types";

const STATES: DashboardState[] = ["populated", "loading", "empty", "error"];

interface Props {
  current: DashboardState;
}

/**
 * Tiny mock-only control that swaps the dashboard between its four
 * section states via the `?state=` query param. Lets reviewers see the
 * loading, empty, and error renders without wiring the UI to a real
 * data source yet.
 */
export function StateSwitcher({ current }: Props) {
  return (
    <nav aria-label="Dashboard state preview" className="state-switcher">
      <span className="state-switcher-label">State:</span>
      {STATES.map((s) => (
        <Link
          key={s}
          href={s === "populated" ? "/" : `/?state=${s}`}
          className={`state-switcher-link${s === current ? " is-active" : ""}`}
          aria-current={s === current ? "page" : undefined}
        >
          {s}
        </Link>
      ))}
    </nav>
  );
}
