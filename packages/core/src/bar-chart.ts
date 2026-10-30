import { BarLayout, BarShape, ResolvedSeries } from './bar-layout.js';
import { seriesColor } from './palette.js';
import { ChartSeries, ValueFormatter } from './types.js';

/** Legend entry. `hidden` marks a series the user toggled off. */
export interface LegendItem {
  name: string;
  color: string;
  hidden?: boolean;
}

export interface TooltipRow {
  name: string;
  value: string;
  /** Swatch color; omit for informational rows (e.g. a capital name). */
  color?: string;
  active?: boolean;
}

/** Tooltip anchored at `(x, y)` in px, relative to the chart plot wrapper. */
export interface TooltipState {
  x: number;
  y: number;
  placement: 'top' | 'right' | 'left';
  title: string;
  rows: TooltipRow[];
}

/** No categories, or every value of every series is `null`/`undefined`. Zeros are data. */
export function isEmptyData(
  categories: readonly string[],
  series: readonly ChartSeries[],
): boolean {
  return categories.length === 0 || !series.some((s) => s.data.some((value) => value != null));
}

/** Assigns palette colors and drops the series hidden through the legend. */
export function resolveSeries(
  series: readonly ChartSeries[],
  hiddenNames: ReadonlySet<string> = new Set(),
): ResolvedSeries[] {
  return series
    .map((s, index) => ({ index, name: s.name, color: seriesColor(index, s.color), data: s.data }))
    .filter((s) => !hiddenNames.has(s.name));
}

export function toLegendItems(
  series: readonly ChartSeries[],
  hiddenNames: ReadonlySet<string> = new Set(),
): LegendItem[] {
  return series.map((s, i) => ({
    name: s.name,
    color: seriesColor(i, s.color),
    hidden: hiddenNames.has(s.name),
  }));
}

/** `'auto'` shows the legend only when there is something to tell apart (2+ series). */
export function isLegendVisible(mode: boolean | 'auto', seriesCount: number): boolean {
  return mode === 'auto' ? seriesCount > 1 : mode;
}

/** Toggles a series name in the hidden set, returning a new set. */
export function toggleHidden(hidden: ReadonlySet<string>, name: string): Set<string> {
  const next = new Set(hidden);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  return next;
}

/** Tooltip for a hovered/focused bar: every visible series of that category, the bar marked. */
export function barTooltip(
  layout: BarLayout,
  series: readonly ResolvedSeries[],
  bar: BarShape,
  format: ValueFormatter,
): TooltipState {
  const rows = categoryRows(series, bar.categoryIndex, bar.seriesIndex, format);
  if (layout.horizontal) {
    const end = bar.x + bar.w;
    return {
      x: end,
      y: bar.y + bar.h / 2,
      placement: end > layout.width * 0.7 ? 'left' : 'right',
      title: bar.category,
      rows,
    };
  }
  return { x: bar.x + bar.w / 2, y: bar.y, placement: 'top', title: bar.category, rows };
}

/** Tooltip for a line-chart point (or any category-aligned shape): all series at that category. */
export function categoryTooltip(
  series: readonly ResolvedSeries[],
  categoryIndex: number,
  activeSeriesIndex: number,
  title: string,
  x: number,
  y: number,
  format: ValueFormatter,
): TooltipState {
  return {
    x,
    y,
    placement: 'top',
    title,
    rows: categoryRows(series, categoryIndex, activeSeriesIndex, format),
  };
}

function categoryRows(
  series: readonly ResolvedSeries[],
  categoryIndex: number,
  activeSeriesIndex: number,
  format: ValueFormatter,
): TooltipRow[] {
  return series.map((s) => {
    const value = s.data[categoryIndex];
    return {
      name: s.name,
      value: value == null ? '—' : format(value),
      color: s.color,
      active: s.index === activeSeriesIndex,
    };
  });
}
