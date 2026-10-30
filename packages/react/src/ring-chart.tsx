import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  computeRingLayout,
  createValueFormatter,
  describeTrend,
  round2,
  type RingItem,
  type RingShape,
  type TooltipState,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { useKaiChartsConfig } from './config';
import { Tooltip } from './tooltip';
import { Trend } from './trend';
import { useContainerWidth } from './use-container-width';

export interface RingChartProps {
  /** Rings, outermost first: `{ name, value, max? (1), color? }`. */
  items?: readonly RingItem[];
  /** Side of the square viewBox in px; the rendered width never exceeds it. */
  size?: number;
  /** Stroke width of every ring (default: computed so the center keeps room for the text). */
  thickness?: number;
  /** Space between rings in px (default 4). */
  gap?: number;
  /** Small text above the center value. */
  centerLabel?: string;
  /** Center value; numbers are formatted with `valueFormat`, strings rendered as they come. */
  centerValue?: number | string;
  /** Variation shown as a trend chip under the center value (ratio, `0.038` → `+3,8%`). */
  centerTrend?: number;
  /** Going down is the good news for the center trend. */
  invertTrend?: boolean;
  /** Name + formatted value per ring, under the figure. */
  showLegend?: boolean;
  /** Format of the ring values (default: percent with at most one decimal). */
  valueFormat?: ValueFormat;
  /** Locale for `Intl` formatting (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** Accessible name of the svg. */
  label?: string;
  /** Replace the rings by a skeleton with `aria-busy`. */
  loading?: boolean;
  /** Empty-state text (defaults to the provider config). */
  emptyText?: string;
  /** Called on click, Enter or Space over a ring with the item and its index in `items`. */
  onRingClick?: (item: RingItem, index: number) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-ring`). */
  className?: string;
  style?: CSSProperties;
}

const NO_ITEMS: readonly RingItem[] = [];
const RING_FORMAT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

/**
 * Concentric progress rings with an optional center label/value/trend and a legend with the
 * figures. Geometry comes from `computeRingLayout` in `kai-charts-core`; same DOM as the Angular
 * `kc-ring-chart`.
 *
 * ```tsx
 * <RingChart items={rings} centerLabel="Saldo" centerValue={0.917} centerTrend={0.038} />
 * ```
 */
export function RingChart({
  items = NO_ITEMS,
  size = 200,
  thickness,
  gap,
  centerLabel = '',
  centerValue,
  centerTrend,
  invertTrend = false,
  showLegend = true,
  valueFormat = RING_FORMAT,
  locale,
  label = '',
  loading = false,
  emptyText,
  onRingClick,
  className,
  style,
}: RingChartProps) {
  const config = useKaiChartsConfig();
  const rootRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(rootRef, 600);
  // The figure is `max-width: size`, so its rendered side is the container width capped at size.
  const renderedWidth = Math.min(width, size);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const resolvedLocale = locale ?? config.locale;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const layout = useMemo(
    () => computeRingLayout({ size, items, format: formatter, thickness, gap }),
    [size, items, formatter, thickness, gap],
  );
  const trendView = useMemo(
    () =>
      typeof centerTrend === 'number'
        ? describeTrend(centerTrend, resolvedLocale, undefined, invertTrend)
        : null,
    [centerTrend, resolvedLocale, invertTrend],
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);
  const showTooltip = (ring: RingShape) => {
    const k = renderedWidth / size;
    setTooltip({
      x: round2(layout.cx * k),
      y: round2((layout.cy - ring.r) * k),
      placement: 'top',
      title: ring.name,
      rows: [{ name: ring.name, value: ring.valueText, color: ring.color, active: true }],
    });
  };
  const activate = (ring: RingShape, event?: KeyboardEvent<SVGCircleElement>) => {
    event?.preventDefault();
    const item = items[ring.index];
    if (item) onRingClick?.(item, ring.index);
  };
  const onRingKeyDown = (ring: RingShape, event: KeyboardEvent<SVGCircleElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(ring, event);
  };

  const rootClass = className ? `kc-chart kc-ring ${className}` : 'kc-chart kc-ring';
  const centerValueText =
    typeof centerValue === 'number' ? formatter(centerValue) : (centerValue ?? '');
  const hasCenter = centerLabel !== '' || centerValue !== undefined || trendView !== null;

  let content;
  if (loading) {
    content = <ChartState kind="loading" height={size} text={config.loadingText} />;
  } else if (items.length === 0) {
    content = <ChartState kind="empty" height={size} text={emptyText ?? config.emptyText} />;
  } else {
    content = (
      <>
        <div className="kc-ring__figure" style={{ maxWidth: size }}>
          <svg
            className="kc-svg kc-ring__svg"
            viewBox={`0 0 ${size} ${size}`}
            role="group"
            aria-label={label || undefined}
            onMouseLeave={hideTooltip}
          >
            {layout.rings.map((ring) => (
              <Fragment key={ring.key}>
                <circle
                  className="kc-ring__track"
                  cx={layout.cx}
                  cy={layout.cy}
                  r={ring.r}
                  strokeWidth={layout.thickness}
                  style={{ stroke: ring.color }}
                />
                <circle
                  className={ring.dash === 0 ? 'kc-ring__arc kc-ring__arc--empty' : 'kc-ring__arc'}
                  cx={layout.cx}
                  cy={layout.cy}
                  r={ring.r}
                  strokeWidth={layout.thickness}
                  style={{ stroke: ring.color }}
                  strokeDasharray={`${ring.dash} ${ring.circumference}`}
                  transform={`rotate(-90 ${layout.cx} ${layout.cy})`}
                  role="img"
                  tabIndex={0}
                  aria-label={ring.ariaLabel}
                  onMouseEnter={() => showTooltip(ring)}
                  onFocus={() => showTooltip(ring)}
                  onBlur={hideTooltip}
                  onClick={() => activate(ring)}
                  onKeyDown={(event) => onRingKeyDown(ring, event)}
                />
              </Fragment>
            ))}
          </svg>
          {hasCenter && (
            <div className="kc-ring__center">
              {centerLabel !== '' && <div className="kc-ring__center-label">{centerLabel}</div>}
              {centerValue !== undefined && (
                <div className="kc-ring__center-value">{centerValueText}</div>
              )}
              {trendView && <Trend trend={trendView} />}
            </div>
          )}
          <Tooltip state={tooltip} />
        </div>
        {showLegend && (
          <ul className="kc-ring__legend">
            {layout.rings.map((ring) => (
              <li key={ring.key} className="kc-ring__legend-item">
                <i className="kc-ring__legend-swatch" style={{ background: ring.color }} />
                <span className="kc-ring__legend-name">{ring.name}</span>
                <span className="kc-ring__legend-value">{ring.valueText}</span>
              </li>
            ))}
          </ul>
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
