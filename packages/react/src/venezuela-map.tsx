import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  VENEZUELA_VIEWBOX,
  buildMapModel,
  createValueFormatter,
  mapTooltipPlacement,
  regionAnchor,
  round2,
  seriesColor,
  type ChartSeries,
  type MapDatum,
  type MapMarker,
  type MapMarkerView,
  type MapRegionView,
  type TooltipRow,
  type TooltipState,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { ChartTable } from './chart-table';
import { useKaiChartsConfig } from './config';
import { Tooltip } from './tooltip';
import { useContainerWidth } from './use-container-width';

/** Payload of `onRegionClick`. `value` is `null` for a region without data. */
export interface MapRegionClickEvent {
  /** ISO 3166-2 code (`VE-V`). */
  id: string;
  /** Region name (or the datum `label` when given). */
  name: string;
  value: number | null;
}

export interface VenezuelaMapProps {
  /** One value per region; `id` accepts ISO codes (`VE-V`) or names (`Zulia`). */
  data?: readonly MapDatum[];
  /** Points of interest (mobile units, offices) projected from lat/lng. */
  markers?: readonly MapMarker[];
  /** Fill color of the regions with data (default: first palette color). */
  color?: string;
  /** Region ids (or names) drawn with a strong outline. */
  highlight?: string | readonly string[];
  /** Gradient min → max, the empty swatch and `filled/total`. */
  showLegend?: boolean;
  /** Short state names at their label points. */
  showLabels?: boolean;
  /** Mirror table (all 26 regions): state · value. */
  showTable?: boolean;
  /** Small dot on every state capital (its name is added to the region tooltip). Default `true`. */
  showCapitals?: boolean;
  /** Name of the capital row in the tooltip. */
  capitalHeader?: string;
  /** Name of the value in the tooltip and the table column header. */
  valueHeader?: string;
  /** Tooltip/table text for regions without data (defaults to the provider config). */
  emptyText?: string;
  /** Fill opacity of the lowest value; the highest is always 1. */
  minOpacity?: number;
  /** Accessible name of the svg; also used as the table caption. */
  label?: string;
  /** Locale for `Intl` formatting (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** `Intl.NumberFormat` options or a custom `(value) => string`. */
  valueFormat?: ValueFormat;
  /** Replace the map by a skeleton with `aria-busy`. */
  loading?: boolean;
  /** Called on click, Enter or Space over a region (`value` is `null` without data). */
  onRegionClick?: (event: MapRegionClickEvent) => void;
  /** Called on click, Enter or Space over a marker, with the original `MapMarker`. */
  onMarkerClick?: (marker: MapMarker) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-map`). */
  className?: string;
  style?: CSSProperties;
}

const NO_DATA: readonly MapDatum[] = [];
const NO_MARKERS: readonly MapMarker[] = [];
const NO_HIGHLIGHT: readonly string[] = [];
const { width: VIEW_W, height: VIEW_H } = VENEZUELA_VIEWBOX;

/**
 * Choropleth of Venezuela (the 24 states — Guayana Esequiba included —, Distrito Capital and Dependencias Federales) that fills in
 * as data arrives: regions without a value stay grey, regions with data are painted with one
 * color whose opacity grows with the value. Geometry, projection and the model come from
 * `kai-charts-core`; same DOM as the Angular `kc-venezuela-map`.
 *
 * ```tsx
 * <VenezuelaMap data={citizens} markers={units} highlight="VE-V" valueHeader="Ciudadanos" />
 * ```
 */
export function VenezuelaMap({
  data = NO_DATA,
  markers = NO_MARKERS,
  color = seriesColor(0),
  highlight = NO_HIGHLIGHT,
  showLegend = true,
  showLabels = false,
  showTable = false,
  showCapitals = true,
  capitalHeader = 'Capital',
  valueHeader = 'Valor',
  emptyText,
  minOpacity = 0.18,
  label = '',
  locale,
  valueFormat,
  loading = false,
  onRegionClick,
  onMarkerClick,
  className,
  style,
}: VenezuelaMapProps) {
  const config = useKaiChartsConfig();
  const rootRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(rootRef, 600);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const resolvedLocale = locale ?? config.locale;
  const resolvedEmptyText = emptyText ?? config.emptyText;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const highlightIds = useMemo(
    () => (typeof highlight === 'string' ? [highlight] : highlight),
    [highlight],
  );
  const model = useMemo(
    () =>
      buildMapModel(data, markers, formatter, {
        highlight: highlightIds,
        emptyText: resolvedEmptyText,
        minOpacity,
      }),
    [data, markers, formatter, highlightIds, resolvedEmptyText, minOpacity],
  );
  // Draw order: regions without data, then with data, then highlighted (outlines stay visible).
  const orderedRegions = useMemo(() => {
    const empty: MapRegionView[] = [];
    const filled: MapRegionView[] = [];
    const highlighted: MapRegionView[] = [];
    for (const region of model.regions) {
      (region.highlighted ? highlighted : region.hasData ? filled : empty).push(region);
    }
    return [...empty, ...filled, ...highlighted];
  }, [model]);
  const tableSeries = useMemo<ChartSeries[]>(
    () => [{ name: valueHeader, data: model.regions.map((region) => region.value) }],
    [model, valueHeader],
  );
  const tableCategories = useMemo(() => model.regions.map((region) => region.name), [model]);

  const hideTooltip = useCallback(() => setTooltip(null), []);
  const showRegionTooltip = (region: MapRegionView) => {
    const { x, y } = regionAnchor(region, width);
    const rows: TooltipRow[] = [{ name: valueHeader, value: region.valueText, color }];
    if (showCapitals && region.capitalPoint) {
      rows.push({ name: capitalHeader, value: region.capitalPoint.name });
    }
    setTooltip({ x, y, placement: mapTooltipPlacement(x, width), title: region.name, rows });
  };
  const showMarkerTooltip = (marker: MapMarkerView) => {
    const k = width / VIEW_W;
    const x = round2(marker.x * k);
    setTooltip({
      x,
      y: round2(marker.y * k),
      placement: mapTooltipPlacement(x, width),
      title: marker.label,
      rows: [{ name: valueHeader, value: marker.valueText, color: marker.color }],
    });
  };

  const activateRegion = (region: MapRegionView, event?: KeyboardEvent<SVGPathElement>) => {
    event?.preventDefault();
    onRegionClick?.({ id: region.id, name: region.name, value: region.value });
  };
  const onRegionKeyDown = (region: MapRegionView, event: KeyboardEvent<SVGPathElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activateRegion(region, event);
  };
  const activateMarker = (index: number, event?: KeyboardEvent<SVGGElement>) => {
    event?.preventDefault();
    const marker = markers[index];
    if (marker) onMarkerClick?.(marker);
  };
  const onMarkerKeyDown = (index: number, event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activateMarker(index, event);
  };

  const regionsClickable = onRegionClick !== undefined;
  const markersClickable = onMarkerClick !== undefined;
  const rootClass = className ? `kc-chart kc-map ${className}` : 'kc-chart kc-map';
  const rootStyle = {
    ...style,
    '--kc-map-fill': color,
    '--kc-map-min': `${round2(minOpacity * 100)}%`,
  } as CSSProperties;

  let content;
  if (loading) {
    content = (
      <ChartState
        kind="loading"
        height={Math.round((width * VIEW_H) / VIEW_W)}
        text={config.loadingText}
      />
    );
  } else {
    content = (
      <>
        <div className="kc-plot">
          <svg
            className="kc-svg kc-map__svg"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            role="group"
            aria-label={label || undefined}
            onMouseLeave={hideTooltip}
          >
            {orderedRegions.map((region) => {
              const classes = ['kc-map__region'];
              if (!region.hasData) classes.push('kc-map__region--empty');
              if (region.highlighted) classes.push('kc-map__region--highlighted');
              if (regionsClickable) classes.push('kc-map__region--clickable');
              return (
                <path
                  key={region.id}
                  className={classes.join(' ')}
                  d={region.path}
                  style={region.hasData ? { fill: color } : undefined}
                  fillOpacity={region.hasData ? region.opacity : undefined}
                  role="img"
                  tabIndex={0}
                  aria-label={region.ariaLabel}
                  data-id={region.id}
                  onMouseEnter={() => showRegionTooltip(region)}
                  onFocus={() => showRegionTooltip(region)}
                  onBlur={hideTooltip}
                  onClick={() => activateRegion(region)}
                  onKeyDown={(event) => onRegionKeyDown(region, event)}
                />
              );
            })}
            {showLabels &&
              model.regions.map((region) => (
                <text key={region.id} className="kc-map__label" x={region.labelX} y={region.labelY}>
                  {region.short}
                </text>
              ))}
            {showCapitals &&
              model.regions.map((region) =>
                region.capitalPoint ? (
                  <circle
                    key={region.id}
                    className="kc-map__capital"
                    cx={region.capitalPoint.x}
                    cy={region.capitalPoint.y}
                    r="3"
                    aria-hidden="true"
                  />
                ) : null,
              )}
            {model.markers.map((marker, index) => (
              <g
                key={marker.id}
                className={
                  markersClickable ? 'kc-map__marker kc-map__marker--clickable' : 'kc-map__marker'
                }
                transform={`translate(${marker.x} ${marker.y})`}
                style={{ '--kc-marker-color': marker.color } as CSSProperties}
                role="img"
                tabIndex={0}
                aria-label={marker.ariaLabel}
                onMouseEnter={() => showMarkerTooltip(marker)}
                onFocus={() => showMarkerTooltip(marker)}
                onBlur={hideTooltip}
                onClick={() => activateMarker(index)}
                onKeyDown={(event) => onMarkerKeyDown(index, event)}
              >
                <circle className="kc-map__marker-halo" r="9" />
                <circle className="kc-map__marker-dot" r="4.5" />
              </g>
            ))}
          </svg>
          <Tooltip state={tooltip} />
        </div>
        {showLegend && model.legend.visible && (
          <div className="kc-map__legend">
            <span className="kc-map__legend-min">{model.legend.minText}</span>
            <span className="kc-map__legend-bar" />
            <span className="kc-map__legend-max">{model.legend.maxText}</span>
            <span className="kc-map__legend-empty">
              <i className="kc-map__legend-swatch" />
              {`${resolvedEmptyText} · ${model.filled}/${model.total}`}
            </span>
          </div>
        )}
        {showTable && (
          <ChartTable
            categories={tableCategories}
            series={tableSeries}
            format={formatter}
            caption={label}
            categoryHeader={config.categoryHeader}
            emptyText={resolvedEmptyText}
          />
        )}
      </>
    );
  }

  return (
    <div ref={rootRef} className={rootClass} style={rootStyle}>
      {content}
    </div>
  );
}
