import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  categoryTooltip,
  computeLineLayout,
  createValueFormatter,
  isEmptyData,
  isLegendVisible,
  resolveSeries,
  toLegendItems,
  toggleHidden,
  type ChartPointEvent,
  type ChartSeries,
  type CurveType,
  type LinePoint,
  type TooltipState,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { ChartTable } from './chart-table';
import { useKaiChartsConfig } from './config';
import { Legend } from './legend';
import { Tooltip } from './tooltip';
import { useContainerWidth } from './use-container-width';

export interface LineChartProps {
  /** Category labels along the x axis. */
  categories: readonly string[];
  /** One or more series, one value per category; `null` values break the line (gap). */
  series: readonly ChartSeries[];
  /** `smooth` = monotone cubic (never overshoots the data); `linear` = straight segments. */
  curve?: CurveType;
  /** Soft fill between each line and the baseline. */
  area?: boolean;
  /** Force the value axis to include zero; `false` zooms into the data range. */
  includeZero?: boolean;
  /** Chart height in px. Width always follows the container. */
  height?: number;
  /** `'auto'` shows the legend only with 2+ series. Clicking an item toggles the series. */
  showLegend?: boolean | 'auto';
  showGrid?: boolean;
  /** `false` hides the value ticks and their margin (the mockup look). */
  showValueAxis?: boolean;
  showCategoryAxis?: boolean;
  /** Print the last value of each series next to its last point. */
  showEndValues?: boolean;
  /** Radius of the points in px; points stay focusable even when tiny. */
  pointRadius?: number;
  /** Render the data as an accessible, printable table below the chart. */
  showTable?: boolean;
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
  /** Called on click, Enter or Space over a point. */
  onPointClick?: (event: ChartPointEvent) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-line-chart`). */
  className?: string;
  style?: CSSProperties;
}

/**
 * Line chart: one or more series over shared categories, straight or monotone-smooth, with an
 * optional area, end values and the same legend/tooltip/table as the bar chart. All geometry
 * comes from `computeLineLayout` in `kai-charts-core`; same DOM as the Angular `kc-line-chart`.
 *
 * ```tsx
 * <LineChart categories={months} series={series} area showEndValues label="Jornadas" />
 * ```
 */
export function LineChart({
  categories,
  series,
  curve = 'smooth',
  area = false,
  includeZero = true,
  height = 280,
  showLegend = 'auto',
  showGrid = true,
  showValueAxis = true,
  showCategoryAxis = true,
  showEndValues = false,
  pointRadius = 3,
  showTable = false,
  loading = false,
  label = '',
  categoryHeader,
  emptyText,
  locale,
  valueFormat,
  onPointClick,
  className,
  style,
}: LineChartProps) {
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
  const layout = useMemo(
    () =>
      computeLineLayout({
        width,
        height,
        categories,
        series: visibleSeries,
        format: formatter,
        curve,
        area,
        includeZero,
        showValueAxis,
        showCategoryAxis,
        showEndValues,
        pointRadius,
      }),
    [
      width,
      height,
      categories,
      visibleSeries,
      formatter,
      curve,
      area,
      includeZero,
      showValueAxis,
      showCategoryAxis,
      showEndValues,
      pointRadius,
    ],
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);
  const showTooltip = (point: LinePoint) =>
    setTooltip(
      categoryTooltip(
        visibleSeries,
        point.categoryIndex,
        point.seriesIndex,
        point.category,
        point.x,
        point.y,
        formatter,
      ),
    );
  const toggleSeries = (index: number) => {
    const name = series[index]?.name;
    if (name !== undefined) setHiddenSeries((hidden) => toggleHidden(hidden, name));
  };
  const activate = (point: LinePoint, event?: KeyboardEvent<SVGCircleElement>) => {
    event?.preventDefault();
    onPointClick?.({
      seriesIndex: point.seriesIndex,
      categoryIndex: point.categoryIndex,
      series: point.series,
      category: point.category,
      value: point.value,
    });
  };
  const onPointKeyDown = (point: LinePoint, event: KeyboardEvent<SVGCircleElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(point, event);
  };

  const rootClass = className ? `kc-chart kc-line-chart ${className}` : 'kc-chart kc-line-chart';
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
            {area &&
              layout.series.map(
                (s) =>
                  s.areaD && (
                    <path
                      key={s.key}
                      className="kc-area"
                      d={s.areaD}
                      style={{ fill: s.color }}
                      data-series={s.seriesIndex}
                    />
                  ),
              )}
            {layout.series.map((s) => (
              <path
                key={s.key}
                className="kc-line"
                d={s.d}
                style={{ stroke: s.color }}
                data-series={s.seriesIndex}
              />
            ))}
            {layout.series.flatMap((s) =>
              s.points.map((point) => (
                <circle
                  key={point.key}
                  className="kc-point"
                  cx={point.x}
                  cy={point.y}
                  r={pointRadius}
                  style={{ fill: point.color }}
                  data-series={point.seriesIndex}
                  data-category={point.categoryIndex}
                  role="img"
                  tabIndex={0}
                  aria-label={point.ariaLabel}
                  onMouseEnter={() => showTooltip(point)}
                  onFocus={() => showTooltip(point)}
                  onBlur={hideTooltip}
                  onClick={() => activate(point)}
                  onKeyDown={(event) => onPointKeyDown(point, event)}
                />
              )),
            )}
            {layout.endLabels.map((v) => (
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
