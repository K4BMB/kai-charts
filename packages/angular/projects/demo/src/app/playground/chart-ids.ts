/** Ids of the playground sandboxes, in picker order (see docs/contract.md, "Playground v2"). */
export const CHART_IDS = [
  'bar',
  'line',
  'ring',
  'kpi',
  'progress',
  'ranking',
  'table',
  'calendar',
  'map',
] as const;

export type ChartId = (typeof CHART_IDS)[number];

export interface ChartEntry {
  id: ChartId;
  label: string;
}

/** Picker entries: id → Spanish label. */
export const CHARTS: readonly ChartEntry[] = [
  { id: 'bar', label: 'Barras' },
  { id: 'line', label: 'Líneas' },
  { id: 'ring', label: 'Anillos' },
  { id: 'kpi', label: 'KPI' },
  { id: 'progress', label: 'Progreso' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'table', label: 'Tabla' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'map', label: 'Mapa' },
];

/** Unknown or missing ids fall back to the bar sandbox. */
export function normalizeChartId(id: string | undefined): ChartId {
  return (CHART_IDS as readonly string[]).includes(id ?? '') ? (id as ChartId) : 'bar';
}
