import { seriesColor } from './palette.js';
import { round2 } from './text.js';
import { clamp } from './tone.js';
import { ValueFormatter } from './types.js';
import {
  MapRegionGeometry,
  VENEZUELA_PROJECTION,
  VENEZUELA_STATES,
  VENEZUELA_VIEWBOX,
} from './data/venezuela.js';

export { VENEZUELA_STATES, VENEZUELA_VIEWBOX, type MapRegionGeometry };

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
  /** Projected state capital in viewBox px, `null` when the region has none. */
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
  /** Regions with data / total regions, e.g. "12 de 25". */
  filled: number;
  total: number;
}

export interface MapModelOptions {
  highlight?: readonly string[];
  emptyText?: string;
  /** Opacity of the lowest value; the highest is always 1. */
  minOpacity?: number;
}

/** Lon/lat → viewBox px with the exact parameters used to build the geometry. */
export function projectVenezuela(lat: number, lng: number): { x: number; y: number } {
  const { minLng, maxLat, cosMid, scale } = VENEZUELA_PROJECTION;
  return { x: round2((lng - minLng) * cosMid * scale), y: round2((maxLat - lat) * scale) };
}

const ALIASES: Record<string, string> = {
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

const BY_NAME = new Map<string, string>();
for (const region of VENEZUELA_STATES) {
  BY_NAME.set(fold(region.name), region.id);
  BY_NAME.set(fold(region.short), region.id);
}
for (const [alias, id] of Object.entries(ALIASES)) BY_NAME.set(alias, id);

/**
 * Resolves `VE-V`, `ve-v`, `Zulia`, `zulia`, `Dtto. Capital`, `Vargas`… to the region id
 * (ISO 3166-2 code, or `VE-GE` for Guayana Esequiba). Returns `undefined` for unknown input.
 */
export function normalizeRegionId(input: string): string | undefined {
  const trimmed = input.trim();
  const iso = trimmed.toUpperCase();
  if (/^VE-[A-Z]{1,2}$/.test(iso) && VENEZUELA_STATES.some((s) => s.id === iso)) return iso;
  return BY_NAME.get(fold(trimmed));
}

/** Joins geometry and data: value per region, opacity scale, markers and legend. */
export function buildMapModel(
  data: readonly MapDatum[],
  markers: readonly MapMarker[],
  format: ValueFormatter,
  options: MapModelOptions = {},
): MapModel {
  const emptyText = options.emptyText ?? '—';
  const minOpacity = options.minOpacity ?? 0.18;
  const highlight = new Set((options.highlight ?? []).map((h) => normalizeRegionId(h) ?? h));

  const values = new Map<string, { value: number | null; label?: string }>();
  const unmatched: string[] = [];
  for (const datum of data) {
    const id = normalizeRegionId(datum.id);
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

  const regions: MapRegionView[] = VENEZUELA_STATES.map((geometry) => {
    const entry = values.get(geometry.id);
    const value = entry?.value ?? null;
    const hasData = value !== null;
    const name = entry?.label ?? geometry.name;
    const valueText = hasData ? format(value) : emptyText;
    const opacity = !hasData
      ? 0
      : span === 0
        ? 1
        : round2(minOpacity + ((value - min) / span) * (1 - minOpacity));
    return {
      ...geometry,
      name,
      value,
      valueText,
      hasData,
      opacity: clamp(opacity, 0, 1),
      ariaLabel: `${name}: ${valueText}`,
      highlighted: highlight.has(geometry.id),
      capitalPoint: geometry.capital
        ? {
            name: geometry.capital.name,
            ...projectVenezuela(geometry.capital.lat, geometry.capital.lng),
          }
        : null,
    };
  });

  const markerViews: MapMarkerView[] = markers.map((marker) => {
    const { x, y } = projectVenezuela(marker.lat, marker.lng);
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
  };
}

/** Tooltip anchor for a region: its label point in px for a rendered width. */
export function regionAnchor(
  region: MapRegionGeometry,
  renderedWidth: number,
): { x: number; y: number } {
  const k = renderedWidth / VENEZUELA_VIEWBOX.width;
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
