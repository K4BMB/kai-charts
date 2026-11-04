import { seriesColor } from './palette.js';
import { round2 } from './text.js';
import { clamp } from './tone.js';
import { ValueFormatter } from './types.js';
import { TooltipRow } from './bar-chart.js';
import { STATE_MAPS } from './data/states/index.js';
import type { MapProjection, MapRegionGeometry, RegionMapGeometry } from './data/map-types.js';
import { VENEZUELA_PROJECTION, VENEZUELA_STATES, VENEZUELA_VIEWBOX } from './data/venezuela.js';

export {
  VENEZUELA_STATES,
  VENEZUELA_VIEWBOX,
  type MapProjection,
  type MapRegionGeometry,
  type RegionMapGeometry,
};

/** The national map: the 26 regions (states) of Venezuela. State maps come from `loadStateMap()`. */
export const VENEZUELA_MAP: RegionMapGeometry = {
  id: 'VE',
  name: 'Venezuela',
  viewBox: VENEZUELA_VIEWBOX,
  projection: VENEZUELA_PROJECTION,
  regions: VENEZUELA_STATES,
};

/** A value for one region. `id` may be an ISO 3166-2 code (`VE-V`) or the state name. */
export interface MapDatum {
  id: string;
  value: number | null | undefined;
  /** Overrides the region name in tooltips and tables. */
  label?: string;
}

/** A point of interest (mobile unit, office…). */
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  value?: number;
  color?: string;
}

export interface MapRegionView extends MapRegionGeometry {
  value: number | null;
  valueText: string;
  hasData: boolean;
  /** Fill opacity 0–1 for regions with data (0 when there is none). */
  opacity: number;
  ariaLabel: string;
  highlighted: boolean;
  /** Projected capital (state capital / municipal seat) in viewBox px, `null` when none. */
  capitalPoint: { name: string; x: number; y: number } | null;
}

export interface MapMarkerView {
  id: string;
  x: number;
  y: number;
  label: string;
  valueText: string;
  color: string;
  ariaLabel: string;
}

export interface MapLegend {
  min: number;
  max: number;
  minText: string;
  maxText: string;
  /** False when no region has data yet. */
  visible: boolean;
}

export interface MapModel {
  regions: MapRegionView[];
  markers: MapMarkerView[];
  legend: MapLegend;
  /** Ids from `data` that matched no region (typos, unsupported names). */
  unmatched: string[];
  /** Regions with data / total regions, e.g. "12 de 26". */
  filled: number;
  total: number;
  /** Capital of the whole map (the state capital on a state map) in viewBox px, `null` when none. */
  capital: { name: string; x: number; y: number } | null;
}

export interface MapModelOptions {
  highlight?: readonly string[];
  emptyText?: string;
  /** Opacity of the lowest value; the highest is always 1. */
  minOpacity?: number;
  /** Map to join the data with (default: the national map, `VENEZUELA_MAP`). */
  geometry?: RegionMapGeometry;
}

/** Lon/lat → viewBox px with the exact parameters used to build a map's geometry. */
export function projectPoint(
  projection: MapProjection,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const { minLng, maxLat, cosMid, scale } = projection;
  return { x: round2((lng - minLng) * cosMid * scale), y: round2((maxLat - lat) * scale) };
}

/** Lon/lat → px on the national map (`projectPoint(VENEZUELA_MAP.projection, …)`). */
export function projectVenezuela(lat: number, lng: number): { x: number; y: number } {
  return projectPoint(VENEZUELA_PROJECTION, lat, lng);
}

const VENEZUELA_ALIASES: Record<string, string> = {
  caracas: 'VE-A',
  'dtto capital': 'VE-A',
  'distrito federal': 'VE-A',
  vargas: 'VE-X',
  'estado vargas': 'VE-X',
  'dependencias federales': 'VE-W',
  'dep federales': 'VE-W',
  esequibo: 'VE-GE',
  'estado guayana esequiba': 'VE-GE',
  'zona en reclamacion': 'VE-GE',
  // Id used by kai-charts < 0.5 for the same region.
  've zr': 'VE-GE',
};

/** Per-geometry lookup: folded id, name, short name and code → region id. */
const LOOKUPS = new WeakMap<RegionMapGeometry, Map<string, string>>();

function lookup(geometry: RegionMapGeometry): Map<string, string> {
  let map = LOOKUPS.get(geometry);
  if (!map) {
    map = new Map<string, string>();
    for (const region of geometry.regions) {
      map.set(fold(region.id), region.id);
      map.set(fold(region.name), region.id);
      map.set(fold(region.short), region.id);
      if (region.code) map.set(fold(region.code), region.id);
    }
    if (geometry === VENEZUELA_MAP) {
      for (const [alias, id] of Object.entries(VENEZUELA_ALIASES)) map.set(alias, id);
    }
    LOOKUPS.set(geometry, map);
  }
  return map;
}

/**
 * Resolves an id, a name (accent- and case-insensitive), a short name or an official code to
 * the region id of a map: `VE-V` / `Zulia` / `zulia` on the national map, `maracaibo` /
 * `Maracaibo` / `2308` (INE code) on the Zulia map. Returns `undefined` for unknown input.
 */
export function resolveRegionId(geometry: RegionMapGeometry, input: string): string | undefined {
  return lookup(geometry).get(fold(input));
}

/**
 * Resolves `VE-V`, `ve-v`, `Zulia`, `zulia`, `Dtto. Capital`, `Vargas`… to the region id of
 * the national map (ISO 3166-2 code, or `VE-GE` for Guayana Esequiba).
 */
export function normalizeRegionId(input: string): string | undefined {
  return resolveRegionId(VENEZUELA_MAP, input);
}

/** Joins geometry and data: value per region, opacity scale, markers, capitals and legend. */
export function buildMapModel(
  data: readonly MapDatum[],
  markers: readonly MapMarker[],
  format: ValueFormatter,
  options: MapModelOptions = {},
): MapModel {
  const geometry = options.geometry ?? VENEZUELA_MAP;
  const emptyText = options.emptyText ?? '—';
  const minOpacity = options.minOpacity ?? 0.18;
  const resolve = (input: string) => resolveRegionId(geometry, input);
  const highlight = new Set((options.highlight ?? []).map((h) => resolve(h) ?? h));
  const project = (lat: number, lng: number) => projectPoint(geometry.projection, lat, lng);

  const values = new Map<string, { value: number | null; label?: string }>();
  const unmatched: string[] = [];
  for (const datum of data) {
    const id = resolve(datum.id);
    if (!id) {
      unmatched.push(datum.id);
      continue;
    }
    values.set(id, { value: isFinite(datum.value) ? datum.value : null, label: datum.label });
  }

  const present = [...values.values()].map((v) => v.value).filter(isFinite);
  const min = present.length ? Math.min(...present) : 0;
  const max = present.length ? Math.max(...present) : 0;
  const span = max - min;

  const regions: MapRegionView[] = geometry.regions.map((region) => {
    const entry = values.get(region.id);
    const value = entry?.value ?? null;
    const hasData = value !== null;
    const name = entry?.label ?? region.name;
    const valueText = hasData ? format(value) : emptyText;
    const opacity = !hasData
      ? 0
      : span === 0
        ? 1
        : round2(minOpacity + ((value - min) / span) * (1 - minOpacity));
    return {
      ...region,
      name,
      value,
      valueText,
      hasData,
      opacity: clamp(opacity, 0, 1),
      ariaLabel: `${name}: ${valueText}`,
      highlighted: highlight.has(region.id),
      capitalPoint: region.capital
        ? { name: region.capital.name, ...project(region.capital.lat, region.capital.lng) }
        : null,
    };
  });

  const markerViews: MapMarkerView[] = markers.map((marker) => {
    const { x, y } = project(marker.lat, marker.lng);
    const label = marker.label ?? marker.id;
    const valueText = marker.value == null ? '' : format(marker.value);
    return {
      id: marker.id,
      x,
      y,
      label,
      valueText,
      color: marker.color ?? seriesColor(0),
      ariaLabel: valueText ? `${label}: ${valueText}` : label,
    };
  });

  return {
    regions,
    markers: markerViews,
    legend: {
      min,
      max,
      minText: format(min),
      maxText: format(max),
      visible: present.length > 0,
    },
    unmatched,
    filled: regions.filter((r) => r.hasData).length,
    total: regions.length,
    capital: geometry.capital
      ? { name: geometry.capital.name, ...project(geometry.capital.lat, geometry.capital.lng) }
      : null,
  };
}

/**
 * Tooltip anchor for a region: its label point in px for a rendered width (`viewBoxWidth` is
 * the width the geometry was built in; the national map's by default).
 */
export function regionAnchor(
  region: MapRegionGeometry,
  renderedWidth: number,
  viewBoxWidth: number = VENEZUELA_VIEWBOX.width,
): { x: number; y: number } {
  const k = renderedWidth / viewBoxWidth;
  return { x: round2(region.labelX * k), y: round2(region.labelY * k) };
}

/**
 * Tooltip placement for an anchor inside the rendered map: sideways near the left/right edges
 * (Zulia, Delta Amacuro) so the bubble stays inside the chart, `top` elsewhere.
 */
export function mapTooltipPlacement(x: number, renderedWidth: number): 'top' | 'right' | 'left' {
  if (x < renderedWidth * 0.2) return 'right';
  if (x > renderedWidth * 0.8) return 'left';
  return 'top';
}

/** States drawn as a single region because they have no official municipal division. */
const NO_MUNICIPAL_DIVISION = new Set(['VE-GE', 'VE-W']);

/**
 * Number of municipalities of a state (`Zulia` → 21, `VE-A` → 1); `undefined` for unknown
 * input and for Guayana Esequiba and Dependencias Federales, which have no municipal division.
 */
export function municipalityCount(state: string): number | undefined {
  const id = normalizeRegionId(state);
  if (!id || NO_MUNICIPAL_DIVISION.has(id)) return undefined;
  return STATE_MAPS.find((s) => s.id === id)?.regions;
}

export interface MapTooltipRowsOptions {
  /** Name of the value row (`Ciudadanos`). */
  valueHeader: string;
  /** Swatch color of the value row (the map fill). */
  color: string;
  /** Name of the capital row; empty string hides it. Default `Capital`. */
  capitalHeader?: string;
  /**
   * Name of the `Municipios = N` row, added on the national map only (states with a municipal
   * division). Omit to leave it out.
   */
  municipalitiesHeader?: string;
  /** Map the region belongs to (default: the national map). */
  geometry?: RegionMapGeometry;
}

/**
 * Tooltip rows of a region, the same in every renderer: `Ciudadanos = 5.260`, then
 * `Capital = Maracaibo` when the region has a capital (state capital on the national map,
 * municipal seat on a state map) and `Municipios = 21` on the national map when asked for.
 */
export function mapTooltipRows(
  region: MapRegionView,
  options: MapTooltipRowsOptions,
): TooltipRow[] {
  const geometry = options.geometry ?? VENEZUELA_MAP;
  const capitalHeader = options.capitalHeader ?? 'Capital';
  const rows: TooltipRow[] = [
    { name: options.valueHeader, value: region.valueText, color: options.color },
  ];
  if (capitalHeader && region.capitalPoint) {
    rows.push({ name: capitalHeader, value: region.capitalPoint.name });
  }
  if (options.municipalitiesHeader && geometry.id === VENEZUELA_MAP.id) {
    const count = municipalityCount(region.id);
    if (count !== undefined)
      rows.push({ name: options.municipalitiesHeader, value: String(count) });
  }
  return rows;
}

function isFinite(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Lowercase, no accents, no punctuation: `Dtto. Capital` → `dtto capital`. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
