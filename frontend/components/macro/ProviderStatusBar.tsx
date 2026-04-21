import type { ProviderStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

interface Props {
  /** Overall dashboard mode surfaced by the live-data orchestrator. */
  mode: "live" | "cached" | "mock" | "mixed";
  providers: ProviderStatus[];
}

const MODE_PILL: Record<Props["mode"], { label: string; tone: string }> = {
  live: { label: "Canlı veri", tone: "positive" },
  cached: { label: "Önbellek", tone: "warning" },
  mock: { label: "Mock veri", tone: "neutral" },
  mixed: { label: "Kısmen canlı", tone: "warning" },
};

const PROVIDER_MODE_LABEL: Record<ProviderStatus["mode"], string> = {
  live: "canlı",
  cached: "önbellek",
  mock: "mock",
};

/**
 * Header strip that surfaces live-data health: the overall resolution
 * mode plus one chip per provider so readers can see at a glance
 * which upstream feeds are healthy, degraded, or disabled.
 */
export function ProviderStatusBar({ mode, providers }: Props) {
  const pill = MODE_PILL[mode];
  if (providers.length === 0 && mode === "mock") {
    return (
      <div className="provider-status-bar" aria-label="Veri modu">
        <span className={`provider-status-mode tone-${pill.tone}`}>
          {pill.label}
        </span>
      </div>
    );
  }

  return (
    <div className="provider-status-bar" aria-label="Sağlayıcı durumu">
      <span className={`provider-status-mode tone-${pill.tone}`}>
        {pill.label}
      </span>
      {providers.length > 0 ? (
        <ul className="provider-status-list">
          {providers.map((provider) => (
            <li
              key={provider.code}
              className={`provider-status-chip tone-${toneFor(provider.mode)}`}
              title={buildTooltip(provider)}
            >
              <span className="provider-status-chip-code">{provider.code}</span>
              <span className="provider-status-chip-mode">
                {PROVIDER_MODE_LABEL[provider.mode]}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function toneFor(mode: ProviderStatus["mode"]): string {
  if (mode === "live") return "positive";
  if (mode === "cached") return "warning";
  return "neutral";
}

function buildTooltip(provider: ProviderStatus): string {
  const parts: string[] = [provider.label];
  if (provider.lastSuccessAt) {
    parts.push(`Son başarılı: ${formatDateTime(provider.lastSuccessAt)}`);
  }
  if (provider.lastError) {
    parts.push(`Son hata: ${provider.lastError}`);
  }
  return parts.join(" · ");
}
