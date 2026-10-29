/** A single value of a series. `null`/`undefined` renders as a gap (no bar, no point). */
export type ChartValue = number | null | undefined;

/** One series of values aligned with the chart categories. */
export interface ChartSeries {
  /** Display name used by the legend, the tooltip and the mirror table. */
  name: string;
  /** One value per category, in category order. */
  data: readonly ChartValue[];
  /** Any CSS color. Defaults to the `--kc-color-N` token for the series index. */
  color?: string;
}

/** Formats a numeric value for axes, labels, tooltips and tables. */
export type ValueFormatter = (value: number) => string;

/** Either `Intl.NumberFormat` options (applied with the chart locale) or a custom formatter. */
export type ValueFormat = Intl.NumberFormatOptions | ValueFormatter;

/** Payload emitted when a data point is clicked or activated with the keyboard. */
export interface ChartPointEvent {
  seriesIndex: number;
  categoryIndex: number;
  series: string;
  category: string;
  value: number;
}

export type Orientation = 'vertical' | 'horizontal';
