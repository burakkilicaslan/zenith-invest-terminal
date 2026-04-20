import Link from "next/link";

import type { MacroRegion } from "@/lib/types";

interface Props {
  current: MacroRegion;
  state: string;
}

const REGIONS: Array<{ id: MacroRegion; label: string; flag: string }> = [
  { id: "us", label: "United States", flag: "🇺🇸" },
  { id: "tr", label: "Türkiye", flag: "🇹🇷" },
];

/**
 * Macro region switcher (US vs TR). Persists the currently-selected
 * preview state so reviewers can toggle regions while exploring the
 * loading / empty / error renders.
 */
export function RegionSwitcher({ current, state }: Props) {
  return (
    <nav aria-label="Macro region" className="region-switcher" role="tablist">
      {REGIONS.map((r) => {
        const isActive = r.id === current;
        const params = new URLSearchParams();
        params.set("region", r.id);
        if (state !== "populated") {
          params.set("state", state);
        }
        const href = `/?${params.toString()}`;
        return (
          <Link
            key={r.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`region-switcher-link${isActive ? " is-active" : ""}`}
          >
            <span aria-hidden="true" style={{ marginRight: 6 }}>
              {r.flag}
            </span>
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}
