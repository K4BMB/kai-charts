import {
  Directive,
  Signal,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import {
  ChartSeries,
  MapDatum,
  MapMarker,
  MapMarkerView,
  MapRegionView,
  RegionMapGeometry,
  TooltipState,
  VENEZUELA_MAP,
  ValueFormat,
  buildMapModel,
  createValueFormatter,
  mapTooltipPlacement,
  mapTooltipRows,
  regionAnchor,
  seriesColor,
} from 'kai-charts-core';
import { KC_CONFIG } from '../core/config';
import { observeWidth } from '../core/resize';

/** Payload of `regionClick`: `value` is `null` for a region without data. */
export interface MapRegionClickEvent {
  /** ISO 3166-2 code on the national map (`VE-V`), municipality slug on a state map (`maracaibo`). */
  id: string;
  name: string;
  value: number | null;
  /** INE municipality code on a state map (`2313`); `undefined` on the national map. */
  code?: string;
}

/** What the template renders: the skeleton, an empty message or the map itself. */
export type RegionMapView = 'loading' | 'empty' | 'map';

/**
 * Everything a region map does — inputs, outputs, data join, tooltip, capital dots, legend and
 * mirror table — parameterised by the geometry it draws: the national map (`KcVenezuelaMap`) or
 * one state by municipalities (`KcStateMap`). Both components extend this class and share one
 * template (`venezuela-map.html`), so their DOM and behaviour cannot drift apart.
 */
@Directive()
export abstract class KcRegionMapBase {
  protected readonly config = inject(KC_CONFIG);
  protected readonly width = observeWidth(600);

  /** Geometry currently drawn; `null` while a state map's chunk is still loading. */
  protected abstract readonly activeGeometry: Signal<RegionMapGeometry | null>;
  /** Text shown instead of the map (unknown state); `null` draws the map. */
  protected abstract readonly emptyMessage: Signal<string | null>;
  /** Header of the first column of the mirror table. */
  protected abstract readonly tableHeader: Signal<string>;

  /** One value per region; `id` accepts ids, names (any accents/case) or official codes. */
  readonly data = input<readonly MapDatum[]>([]);
  /** Points of interest projected from lat/lng. */
  readonly markers = input<readonly MapMarker[]>([]);
  /** Fill color of the regions with data (defaults to the first palette color). */
  readonly color = input(seriesColor(0));
  /** Ids (or names) drawn with a strong outline. */
  readonly highlight = input<string | readonly string[]>([]);
  /** Gradient min→max, empty swatch and `filled/total`. */
  readonly showLegend = input(true, { transform: booleanAttribute });
  /** Short region names at their label points. */
  readonly showLabels = input(false, { transform: booleanAttribute });
  /** Mirror table: one row per region. */
  readonly showTable = input(false, { transform: booleanAttribute });
  /**
   * Capital dots: every state capital on the national map, the state capital on a state map.
   * Dots only — the `Capital = …` tooltip row does not depend on it.
   */
  readonly showCapitals = input(true, { transform: booleanAttribute });
  /** State maps: a small dot on every municipal seat (their names are in the tooltip anyway). */
  readonly showSeats = input(false, { transform: booleanAttribute });
  /** Name of the `Capital = …` tooltip row; empty string hides the row. */
  readonly capitalHeader = input('Capital');
  /** Name of the `Municipios = N` tooltip row (national map only); empty string hides it. */
  readonly municipalitiesHeader = input('Municipios');
  /** Header of the value column in the table and name of the value tooltip row. */
  readonly valueHeader = input('Valor');
  /** Tooltip/table text for regions without data (defaults to the global config). */
  readonly emptyText = input<string | undefined>(undefined);
  /** Opacity of the lowest value; the highest is always 1. */
  readonly minOpacity = input(0.18, { transform: numberAttribute });
  /** Accessible name of the svg; also used as the table caption. */
  readonly label = input('');
  /** Locale for `Intl` formatting (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  /** `Intl.NumberFormat` options or a custom `(value) => string`. */
  readonly valueFormat = input<ValueFormat | undefined>(undefined);
  readonly loading = input(false, { transform: booleanAttribute });

  /** Emitted on click, Enter or Space over a region (`value` is `null` without data). */
  readonly regionClick = output<MapRegionClickEvent>();
  /** Emitted on click, Enter or Space over a marker, with the original `MapMarker`. */
  readonly markerClick = output<MapMarker>();

  protected readonly tooltip = signal<TooltipState | null>(null);

  protected readonly formatter = computed(() =>
    createValueFormatter(this.locale() ?? this.config.locale, this.valueFormat()),
  );
  protected readonly emptyLabel = computed(() => this.emptyText() ?? this.config.emptyText);
  protected readonly loadingText = this.config.loadingText;
  protected readonly minPercent = computed(() => `${Math.round(this.minOpacity() * 100)}%`);

  /** The geometry to measure against: the loaded one, or the national map's frame meanwhile. */
  private readonly frame = computed(() => this.activeGeometry() ?? VENEZUELA_MAP);
  protected readonly isNational = computed(() => this.frame().id === VENEZUELA_MAP.id);
  protected readonly viewBox = computed(() => {
    const { width, height } = this.frame().viewBox;
    return `0 0 ${width} ${height}`;
  });
  protected readonly skeletonHeight = computed(() => {
    const { width, height } = this.frame().viewBox;
    return Math.round((this.width() * height) / width);
  });

  protected readonly view = computed<RegionMapView>(() => {
    if (this.loading()) return 'loading';
    if (this.emptyMessage() !== null) return 'empty';
    return this.activeGeometry() ? 'map' : 'loading';
  });

  private readonly highlightIds = computed<readonly string[]>(() => {
    const value = this.highlight();
    return typeof value === 'string' ? (value ? [value] : []) : value;
  });

  protected readonly model = computed(() =>
    buildMapModel(this.data(), this.markers(), this.formatter(), {
      highlight: this.highlightIds(),
      emptyText: this.emptyLabel(),
      minOpacity: this.minOpacity(),
      geometry: this.frame(),
    }),
  );

  /** Regions without data, with data, highlighted: drawn in that order so outlines stay visible. */
  protected readonly regionGroups = computed<readonly MapRegionView[][]>(() => {
    const regions = this.model().regions;
    return [
      regions.filter((r) => !r.hasData && !r.highlighted),
      regions.filter((r) => r.hasData && !r.highlighted),
      regions.filter((r) => r.highlighted),
    ];
  });

  protected readonly tableCategories = computed(() => this.model().regions.map((r) => r.name));
  protected readonly tableSeries = computed<ChartSeries[]>(() => [
    { name: this.valueHeader(), data: this.model().regions.map((r) => r.value) },
  ]);

  /**
   * Dots on the regions' capitals, drawn after every region so no path paints over them: state
   * capitals on the national map (`showCapitals`), municipal seats on a state map (`showSeats`).
   */
  protected readonly capitals = computed(() => {
    const show = this.isNational() ? this.showCapitals() : this.showSeats();
    return show
      ? this.model()
          .regions.filter((r) => r.capitalPoint)
          .map((r) => ({ id: r.id, ...r.capitalPoint! }))
      : [];
  });
  /** The map's own capital (the state capital on a state map), drawn after the seats. */
  protected readonly stateCapital = computed(() =>
    this.showCapitals() ? this.model().capital : null,
  );

  protected showRegionTooltip(region: MapRegionView): void {
    const geometry = this.frame();
    const { x, y } = regionAnchor(region, this.width(), geometry.viewBox.width);
    this.tooltip.set({
      x,
      y,
      placement: mapTooltipPlacement(x, this.width()),
      title: region.name,
      rows: mapTooltipRows(region, {
        valueHeader: this.valueHeader(),
        color: this.color(),
        capitalHeader: this.capitalHeader(),
        municipalitiesHeader: this.municipalitiesHeader(),
        geometry,
      }),
    });
  }

  protected showMarkerTooltip(marker: MapMarkerView): void {
    const k = this.width() / this.frame().viewBox.width;
    const x = Math.round(marker.x * k * 100) / 100;
    this.tooltip.set({
      x,
      y: Math.round(marker.y * k * 100) / 100,
      placement: mapTooltipPlacement(x, this.width()),
      title: marker.label,
      rows: [{ name: this.valueHeader(), value: marker.valueText, color: marker.color }],
    });
  }

  protected hideTooltip(): void {
    this.tooltip.set(null);
  }

  protected activateRegion(region: MapRegionView, event?: Event): void {
    event?.preventDefault();
    this.regionClick.emit({
      id: region.id,
      name: region.name,
      value: region.value,
      ...(region.code !== undefined ? { code: region.code } : {}),
    });
  }

  protected activateMarker(index: number, event?: Event): void {
    event?.preventDefault();
    const marker = this.markers()[index];
    if (marker) this.markerClick.emit(marker);
  }
}
