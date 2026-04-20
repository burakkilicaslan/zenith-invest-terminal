import Link from "next/link";

import type { DashboardState, MacroRegion } from "@/lib/types";

const STATES: DashboardState[] = ["populated", "loading", "empty", "error"];

const STATE_LABEL: Record<DashboardState, string> = {
  populated: "veriyle dolu",
  loading: "yükleniyor",
  empty: "boş",
  error: "hata",
};

interface Props {
  current: DashboardState;
  region: MacroRegion;
}

/**
 * Mock-only control that swaps the dashboard between its four section
 * states via the `?state=` query param, preserving the active region.
 */
export function StateSwitcher({ current, region }: Props) {
  return (
    <nav aria-label="Panel durum önizlemesi" className="state-switcher">
      <span className="state-switcher-label">Durum:</span>
      {STATES.map((s) => {
        const params = new URLSearchParams();
        params.set("region", region);
        if (s !== "populated") {
          params.set("state", s);
        }
        const href = params.toString() ? `/?${params.toString()}` : "/";
        return (
          <Link
            key={s}
            href={href}
            className={`state-switcher-link${s === current ? " is-active" : ""}`}
            aria-current={s === current ? "page" : undefined}
          >
            {STATE_LABEL[s]}
          </Link>
        );
      })}
    </nav>
  );
}
