// Everything from the headless core (types, layouts, helpers) is re-exported so Angular apps
// only need to import from 'kai-charts'.
export * from 'kai-charts-core';
export {
  KC_CONFIG,
  KC_DEFAULT_CONFIG,
  provideKaiCharts,
  type KaiChartsConfig,
} from './core/config';
export { type ItemClickEvent } from './core/events';
export { observeWidth } from './core/resize';
export { KcLegend } from './core/legend';
export { KcTooltip } from './core/tooltip';
export { KcChartTable } from './core/chart-table';
export { KcChartState } from './core/chart-state';
export { KcTrendChip } from './core/trend-chip';
export { KcBarChart } from './bar-chart/bar-chart';
export { KcIcon, KcKpiCard } from './kpi-card/kpi-card';
export { KcProgressList } from './progress-list/progress-list';
export { KcRankingList } from './ranking-list/ranking-list';
export { KcVenezuelaMap, type MapRegionClickEvent } from './venezuela-map/venezuela-map';
export { KcLineChart } from './line-chart/line-chart';
export { KcRingChart } from './ring-chart/ring-chart';
