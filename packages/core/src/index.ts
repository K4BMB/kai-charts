export * from './types.js';
export { KC_DEFAULTS, type KaiChartsDefaults } from './defaults.js';
export { KC_DEFAULT_PALETTE, KC_PALETTE_SIZE, seriesColor } from './palette.js';
export { createValueFormatter } from './format.js';
export { niceDomain, scaleLinear, tickStep, type NiceDomain } from './scale.js';
export { estimateTextWidth, round2, truncateLabel } from './text.js';
export {
  computeBarLayout,
  type AxisTick,
  type BarLayout,
  type BarLayoutOptions,
  type BarShape,
  type Line,
  type Rect,
  type ResolvedSeries,
  type TextAnchor,
  type ValueLabel,
} from './bar-layout.js';
export {
  barTooltip,
  categoryTooltip,
  isEmptyData,
  isLegendVisible,
  resolveSeries,
  toLegendItems,
  toggleHidden,
  type LegendItem,
  type TooltipRow,
  type TooltipState,
} from './bar-chart.js';
export {
  computeLineLayout,
  linePath,
  type CurveType,
  type LineLayout,
  type LineLayoutOptions,
  type LinePoint,
  type LineSeriesShape,
} from './line-layout.js';
export {
  computeRingLayout,
  type RingItem,
  type RingLayout,
  type RingLayoutOptions,
  type RingShape,
} from './ring-layout.js';
export { clamp, toneColor, type Tone } from './tone.js';
export { KC_TREND_FORMAT, describeTrend, type TrendDirection, type TrendView } from './trend.js';
export { buildProgressRows, type ProgressItem, type ProgressRowView } from './progress.js';
export {
  buildRankingRows,
  type RankingItem,
  type RankingOptions,
  type RankingRowView,
  type RankingSort,
} from './ranking.js';
export {
  VENEZUELA_CLAIM_ZONE,
  VENEZUELA_STATES,
  VENEZUELA_VIEWBOX,
  buildMapModel,
  normalizeRegionId,
  projectVenezuela,
  regionAnchor,
  type MapDatum,
  type MapLegend,
  type MapMarker,
  type MapMarkerView,
  type MapModel,
  type MapModelOptions,
  type MapRegionGeometry,
  type MapRegionView,
} from './venezuela-map.js';
