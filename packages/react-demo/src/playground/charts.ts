/** Charts of the playground, in picker order (ids are the `#/playground/<id>` segment). */
export const CHARTS = [
  { id: 'bar', label: 'Barras' },
  { id: 'line', label: 'Líneas' },
  { id: 'ring', label: 'Anillos' },
  { id: 'kpi', label: 'KPI' },
  { id: 'progress', label: 'Progreso' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'table', label: 'Tabla' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'map', label: 'Mapa' },
] as const;

export type ChartId = (typeof CHARTS)[number]['id'];

/** `#/playground` and unknown ids open this sandbox. */
export const DEFAULT_CHART: ChartId = 'bar';

export function isChartId(value: string): value is ChartId {
  return CHARTS.some((chart) => chart.id === value);
}
