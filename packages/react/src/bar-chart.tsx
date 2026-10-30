import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  barTooltip,
  computeBarLayout,
  createValueFormatter,
  isEmptyData,
  isLegendVisible,
  resolveSeries,
  toLegendItems,
  toggleHidden,
  type BarShape,
  type ChartPointEvent,
  type ChartSeries,
  type Orientation,
  type TooltipState,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { ChartTable } from './chart-table';
import { useKaiChartsConfig } from './config';
import { Legend } from './legend';
import { Tooltip } from './tooltip';
import { useContainerWidth } from './use-container-width';

export interface BarChartProps {
  /** Category labels (x axis when vertical, y axis when horizontal). */
  categories: readonly string[];
  /** One or more series, each with one value per category. */
  series: readonly ChartSeries[];
  orientation?: Orientation;
  /** Stack the series instead of placing them side by side. */
  stacked?: boolean;
  /** Chart height in px. Width always follows the container. */
  height?: number;
  /** `'auto'` shows the legend only with 2+ series. Clicking an item toggles the series. */
  showLegend?: boolean | 'auto';
  /** Print the value at the end of each bar (the total when stacked). */
  showValues?: boolean;
  showGrid?: boolean;
  /** Render the data as an accessible, printable table below the chart. */
  showTable?: boolean;
  barRadius?: number;
  /** Share of each category band occupied by bars, 0.1–1 (default 0.7). Thin bars: 0.25. */
  barWidth?: number;
  /** `false` hides the value ticks and shrinks their margin (grid lines stay). */
  showValueAxis?: boolean;
  /** `false` hides the category labels and shrinks their margin. */
  showCategoryAxis?: boolean;
  /** Stacked only: round the outer corners of each stack with `barRadius`. */
  roundStackTop?: boolean;
  /** Replace the chart by a skeleton with `aria-busy`. */
  loading?: boolean;
  /** Accessible name of the chart; also used as the table caption. */
  label?: string;
  /** Header of the category column in the table (defaults to the provider config). */
  categoryHeader?: string;
  /** Empty-state text (defaults to the provider config). */
  emptyText?: string;
  /** Locale for `Intl` formatting (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** `Intl.NumberFormat` options or a custom `(value) => string`. */
  valueFormat?: ValueFormat;
  /** Called on click, Enter or Space over a bar. */
  onBarClick?: (event: ChartPointEvent) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-bar-chart`). */
  className?: string;
  style?: CSSProperties;
}

/**
 * Bar chart: vertical or horizontal, grouped or stacked. Pure SVG, responsive to its
 * container width, themed through `--kc-*` CSS tokens. All geometry comes from
 * `kai-charts-core`; this component only wires state to JSX.
 *
 * ```tsx
 * <BarChart categories={categories} series={series} label="Trámites por tipo" />
 * ```
 */
export function BarChart({
  categories,
  series,
  orientation = 'vertical',
  stacked = false,
  height = 280,
  showLegend = 'auto',
  showValues = false,
  showGrid = true,
  showTable = false,
  barRadius = 2,
  barWidth = 0.7,
  showValueAxis = true,
  showCategoryAxis = true,
  roundStackTop = false,
  loading = false,
  label = '',
  categoryHeader,
  emptyText,
  locale,
  valueFormat,
  onBarClick,
  className,
  style,
}: BarChartProps) {
  const config = useKaiChartsConfig();
  const rootRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(rootRef, 600);

  const [hiddenSeries, setHiddenSeries] = useState<ReadonlySet<string>>(() => new Set());
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const resolvedLocale = locale ?? config.locale;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const visibleSeries = useMemo(() => resolveSeries(series, hiddenSeries), [series, hiddenSeries]);
  const legendItems = useMemo(() => toLegendItems(series, hiddenSeries), [series, hiddenSeries]);
  const horizontal = orientation === 'horizontal';
  const layout = useMemo(
    () =>
      computeBarLayout({
        width,
        height,
        horizontal,
        stacked,
        showValues,
        barRadius,
        barWidth,
        showValueAxis,
        showCategoryAxis,
        roundStackTop,
        categories,
        series: visibleSeries,
        format: formatter,
      }),
    [
      width,
      height,
      horizontal,
      stacked,
      showValues,
      barRadius,
      barWidth,
      showValueAxis,
      showCategoryAxis,
      roundStackTop,
      categories,
      visibleSeries,
      formatter,
    ],
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);
  const showTooltip = (bar: BarShape) =>
    setTooltip(barTooltip(layout, visibleSeries, bar, formatter));
  const toggleSeries = (index: number) => {
    const name = series[index]?.name;
    if (name !== undefined) setHiddenSeries((hidden) => toggleHidden(hidden, name));
  };
  const activate = (bar: BarShape, event?: KeyboardEvent<SVGRectElement>) => {
    event?.preventDefault();
    onBarClick?.({
      seriesIndex: bar.seriesIndex,
      categoryIndex: bar.categoryIndex,
      series: bar.series,
      category: bar.category,
      value: bar.value,
    });
  };
  const onBarKeyDown = (bar: BarShape, event: KeyboardEvent<SVGRectElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(bar, event);
  };

  const rootClass = className ? `kc-chart kc-bar-chart ${className}` : 'kc-chart kc-bar-chart';
  let content;
  if (loading) {
    content = <ChartState kind="loading" height={height} text={config.loadingText} />;
  } else if (isEmptyData(categories, series)) {
    content = <ChartState kind="empty" height={height} text={emptyText ?? config.emptyText} />;
  } else {
    content = (
      <>
        <div className="kc-plot">
          <svg
            className="kc-svg"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            height={layout.height}
            width="100%"
            role="group"
            aria-label={label || undefined}
            onMouseLeave={hideTooltip}
          >
            {showGrid &&
              layout.gridLines.map((g) => (
                <line key={g.key} className="kc-grid" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} />
              ))}
            {layout.valueTicks.map((t) => (
              <text key={t.key} className="kc-tick" x={t.x} y={t.y} textAnchor={t.anchor}>
                {t.label}
              </text>
            ))}
            {layout.categoryTicks.map((t) => (
              <text key={t.key} className="kc-tick" x={t.x} y={t.y} textAnchor={t.anchor}>
                <title>{t.title}</title>
                {t.label}
              </text>
            ))}
            <line
              className="kc-axis"
              x1={layout.axisLine.x1}
              y1={layout.axisLine.y1}
              x2={layout.axisLine.x2}
              y2={layout.axisLine.y2}
            />
            {layout.bars.map((bar) => (
              <rect
                key={bar.key}
                className="kc-bar"
                x={bar.x}
                y={bar.y}
                width={bar.w}
                height={bar.h}
                rx={bar.rx}
                style={{ fill: bar.color }}
                data-series={bar.seriesIndex}
                data-category={bar.categoryIndex}
                role="img"
                tabIndex={0}
                aria-label={bar.ariaLabel}
                onMouseEnter={() => showTooltip(bar)}
                onFocus={() => showTooltip(bar)}
                onBlur={hideTooltip}
                onClick={() => activate(bar)}
                onKeyDown={(event) => onBarKeyDown(bar, event)}
              />
            ))}
            {layout.valueLabels.map((v) => (
              <text key={v.key} className="kc-value" x={v.x} y={v.y} textAnchor={v.anchor}>
                {v.text}
              </text>
            ))}
          </svg>
          <Tooltip state={tooltip} />
        </div>
        {isLegendVisible(showLegend, series.length) && (
          <Legend items={legendItems} onToggle={toggleSeries} />
        )}
        {showTable && (
          <ChartTable
            categories={categories}
            series={series}
            format={formatter}
            caption={label}
            categoryHeader={categoryHeader ?? config.categoryHeader}
          />
        )}
      </>
    );
  }

  return (
    <div ref={rootRef} className={rootClass} style={style}>
      {content}
    </div>
  );
}
