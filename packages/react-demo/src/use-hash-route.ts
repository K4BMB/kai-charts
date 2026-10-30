import { useSyncExternalStore } from 'react';
import { CHARTS, DEFAULT_CHART, isChartId, type ChartId } from './playground/charts';

export type Route = { name: 'showcase' } | { name: 'playground'; chart: ChartId };

// Routes are shared constants so `useSyncExternalStore` sees a stable snapshot per hash.
const SHOWCASE: Route = { name: 'showcase' };
const PLAYGROUND = Object.fromEntries(
  CHARTS.map((chart) => [chart.id, { name: 'playground', chart: chart.id }]),
) as Record<ChartId, Route>;

/**
 * `#/playground` → bar sandbox, `#/playground/<chart>` → that sandbox (unknown ids fall back to
 * `bar`); anything else (`#/`, empty, unknown) → showcase.
 */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0].replace(/\/$/, '');
  const [section, chart = ''] = path.split('/');
  if (section !== 'playground') return SHOWCASE;
  return PLAYGROUND[isChartId(chart) ? chart : DEFAULT_CHART];
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function snapshot(): Route {
  return parseRoute(window.location.hash);
}

/** Tiny hash router: no dependency, works from any base path (GitHub Pages sub-folder). */
export function useHashRoute(): Route {
  return useSyncExternalStore(subscribe, snapshot, () => SHOWCASE);
}
