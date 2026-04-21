/**
 * Public entry point for the live-data layer.
 *
 * Consumers (currently only `app/page.tsx`) should import from here;
 * everything else in `lib/live/*` is an implementation detail.
 */

export { getMacroDashboard } from "./buildDashboard";
export type { GetMacroDashboardOptions } from "./buildDashboard";
export { isLiveDataEnabled } from "./config";
