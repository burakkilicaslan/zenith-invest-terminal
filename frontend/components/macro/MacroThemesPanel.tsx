import type {
  DashboardState,
  MacroIndicator,
  MacroTheme,
} from "@/lib/types";

import { SectionStateView } from "../dashboard/SectionState";

interface Props {
  themes: MacroTheme[];
  indicators: MacroIndicator[];
  state?: DashboardState;
}

/**
 * Macro themes / watchlist panel. Each theme groups a set of
 * indicators under a shared thesis (e.g. "US recession watch").
 */
export function MacroThemesPanel({
  themes,
  indicators,
  state = "populated",
}: Props) {
  const resolvedState: DashboardState =
    state === "populated" && themes.length === 0 ? "empty" : state;

  const indicatorLookup = new Map(indicators.map((i) => [i.id, i]));

  return (
    <SectionStateView
      state={resolvedState}
      loadingRows={2}
      emptyMessage="Bu bölge için henüz makro tema tanımlanmadı."
      errorMessage="Makro temalar yüklenemedi."
    >
      <div className="theme-list">
        {themes.map((theme) => (
          <article key={theme.id} className="theme-item">
            <header className="theme-head">
              <span className="theme-name">{theme.themeName}</span>
              {theme.bias ? (
                <span className="theme-bias">{theme.bias}</span>
              ) : null}
            </header>
            <p className="theme-description">{theme.description}</p>
            <ul className="theme-indicators">
              {theme.indicators.map((id) => {
                const indicator = indicatorLookup.get(id);
                return (
                  <li className="theme-indicator-chip" key={id}>
                    {indicator ? indicator.label : id}
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </SectionStateView>
  );
}
