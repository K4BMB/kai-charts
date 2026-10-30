// Everything from the headless core (types, layouts, helpers) is re-exported so React apps
// only need to import from 'kai-charts-react'.
export * from 'kai-charts-core';
export { KaiChartsProvider, useKaiChartsConfig, type KaiChartsConfig } from './config';
export type { KaiChartsProviderProps } from './config';
export { useContainerWidth } from './use-container-width';
export { Legend, type LegendProps } from './legend';
export { Tooltip, type TooltipProps } from './tooltip';
export { ChartTable, type ChartTableProps } from './chart-table';
export { ChartState, type ChartStateProps } from './chart-state';
export { BarChart, type BarChartProps } from './bar-chart';
export { Trend, type TrendProps } from './trend';
export { KpiCard, type KpiCardProps } from './kpi-card';
export { ProgressList, type ProgressListProps } from './progress-list';
export { RankingList, type RankingListProps } from './ranking-list';

// Component styles. Vite extracts them to `dist/kai-charts-react.css`; consumers import
// 'kai-charts-react/styles.css' once (tokens are optional: 'kai-charts-core/styles/tokens.css').
import './styles.css';
