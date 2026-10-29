// Everything from the headless core (types, layouts, helpers) is re-exported so Angular apps
// only need to import from 'kai-charts'.
export * from 'kai-charts-core';
export {
  KC_CONFIG,
  KC_DEFAULT_CONFIG,
  provideKaiCharts,
  type KaiChartsConfig,
} from './core/config';
export { observeWidth } from './core/resize';
export { KcLegend } from './core/legend';
export { KcTooltip } from './core/tooltip';
export { KcChartTable } from './core/chart-table';
export { KcChartState } from './core/chart-state';
export { KcBarChart } from './bar-chart/bar-chart';
