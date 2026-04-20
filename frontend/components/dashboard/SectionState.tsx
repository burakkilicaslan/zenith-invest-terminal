import type { ReactNode } from "react";

import type { DashboardState } from "@/lib/types";

interface LoadingProps {
  /** How many skeleton rows to render. Defaults to 3. */
  rows?: number;
  label?: string;
}

export function LoadingState({
  rows = 3,
  label = "Yükleniyor…",
}: LoadingProps) {
  return (
    <div
      className="state-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="sr-only">{label}</div>
      <div className="skeleton-list">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="skeleton-row" key={i} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}

interface EmptyProps {
  message?: string;
}

export function EmptyState({
  message = "Görüntülenecek veri yok.",
}: EmptyProps) {
  return <div className="state-empty">{message}</div>;
}

interface ErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "Bu bölüm yüklenirken bir sorun oluştu.",
  onRetry,
}: ErrorProps) {
  return (
    <div className="state-error" role="alert">
      <div>{message}</div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="state-error-retry"
        >
          Yeniden dene
        </button>
      ) : null}
    </div>
  );
}

interface SectionStateViewProps {
  state: DashboardState;
  loadingRows?: number;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  /** Rendered when `state === "populated"`. */
  children: ReactNode;
}

/**
 * Centralized render switch for a dashboard section's four UI states.
 * Sections pass their populated-state JSX as children and let this
 * component handle the other three states consistently.
 */
export function SectionStateView({
  state,
  loadingRows,
  emptyMessage,
  errorMessage,
  onRetry,
  children,
}: SectionStateViewProps) {
  if (state === "loading") {
    return <LoadingState rows={loadingRows} />;
  }
  if (state === "error") {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }
  if (state === "empty") {
    return <EmptyState message={emptyMessage} />;
  }
  return <>{children}</>;
}
