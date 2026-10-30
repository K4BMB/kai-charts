import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
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
  TooltipRow,
  TooltipState,
  VENEZUELA_CLAIM_ZONE,
  VENEZUELA_VIEWBOX,
  ValueFormat,
  buildMapModel,
  createValueFormatter,
  mapTooltipPlacement,
  regionAnchor,
  seriesColor,
} from 'kai-charts-core';
import { KcChartState } from '../core/chart-state';
import { KcChartTable } from '../core/chart-table';
import { KC_CONFIG } from '../core/config';
import { observeWidth } from '../core/resize';
import { KcTooltip } from '../core/tooltip';

/** Payload of `regionClick`: `value` is `null` for a region without data. */
export interface MapRegionClickEvent {
  /** ISO 3166-2 code, e.g. `VE-V`. */
  id: string;
  name: string;
  value: number | null;
}

/** Every `<pattern>` id must be unique in the page, even with several maps rendered. */
let hatchCounter = 0;

/**
 * Choropleth of Venezuela (23 states, Distrito Capital and Dependencias Federales) that fills
 * in as data arrives: regions without a value stay grey, regions with data are painted with
 * one color whose opacity grows with the value. Optional markers (mobile units, offices) are
 * projected from lat/lng. Geometry and the data join come from `kai-charts-core`
 * (`VENEZUELA_STATES`, `buildMapModel`); this component only wires signals to the template.
 *
 * ```html
 * <kc-venezuela-map [data]="byState" [markers]="units" highlight="VE-V" label="Ciudadanos" />
 * ```
 */
@Component({
  selector: 'kc-venezuela-map',
  imports: [KcChartState, KcChartTable, KcTooltip],
  templateUrl: './venezuela-map.html',
  styles: `
    @import 'kai-charts-core/styles/venezuela-map.css';
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-map',
    '[style.--kc-map-fill]': 'color()',
    '[style.--kc-map-min]': 'minPercent()',
  },
})
export class KcVenezuelaMap {
  private readonly config = inject(KC_CONFIG);
  protected readonly width = observeWidth(600);
  /** Unique id of the hatch pattern of this instance (`kc-hatch-N`). */
  protected readonly hatchId = `kc-hatch-${hatchCounter++}`;
  protected readonly viewBox = `0 0 ${VENEZUELA_VIEWBOX.width} ${VENEZUELA_VIEWBOX.height}`;
  protected readonly claimZone = VENEZUELA_CLAIM_ZONE;

  /** One value per region; `id` accepts ISO codes (`VE-V`) or names (`Zulia`). */
  readonly data = input<readonly MapDatum[]>([]);
  /** Points of interest projected from lat/lng. */
  readonly markers = input<readonly MapMarker[]>([]);
  /** Fill color of the regions with data (defaults to the first palette color). */
  readonly color = input(seriesColor(0));
  /** Ids (or names) drawn with a strong outline. */
  readonly highlight = input<string | readonly string[]>([]);
  /** Gradient min→max, empty swatch and `filled/total`. */
  readonly showLegend = input(true, { transform: booleanAttribute });
  /** Short state names at their label points. */
  readonly showLabels = input(false, { transform: booleanAttribute });
  /** Guayana Esequiba hatched (the official Venezuelan depiction). */
  readonly showClaimZone = input(true, { transform: booleanAttribute });
  /** Text of the claim zone, drawn only with `showLabels`. */
  readonly claimZoneLabel = input('Zona en Reclamación');
  /** Mirror table: one row per region (all 25). */
  readonly showTable = input(false, { transform: booleanAttribute });
  /** Small dot on every state capital (name shown in the region tooltip). */
  readonly showCapitals = input(true, { transform: booleanAttribute });
  /** Name of the capital row in the tooltip. */
  readonly capitalHeader = input('Capital');
  /** Header of the value column in the table and name of the tooltip row. */
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
  protected readonly tableHeader = this.config.categoryHeader;
  protected readonly loadingText = this.config.loadingText;
  protected readonly minPercent = computed(() => `${Math.round(this.minOpacity() * 100)}%`);
  protected readonly skeletonHeight = computed(() =>
    Math.round((this.width() * VENEZUELA_VIEWBOX.height) / VENEZUELA_VIEWBOX.width),
  );

  private readonly highlightIds = computed<readonly string[]>(() => {
    const value = this.highlight();
    return typeof value === 'string' ? (value ? [value] : []) : value;
  });

  protected readonly model = computed(() =>
    buildMapModel(this.data(), this.markers(), this.formatter(), {
      highlight: this.highlightIds(),
      emptyText: this.emptyLabel(),
      minOpacity: this.minOpacity(),
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
  /** Capital dots, drawn after every region so no state paints over them. */
  protected readonly capitals = computed(() =>
    this.showCapitals()
      ? this.model()
          .regions.filter((r) => r.capitalPoint)
          .map((r) => ({ id: r.id, ...r.capitalPoint! }))
      : [],
  );

  protected showRegionTooltip(region: MapRegionView): void {
    const { x, y } = regionAnchor(region, this.width());
    const rows: TooltipRow[] = [
      { name: this.valueHeader(), value: region.valueText, color: this.color() },
    ];
    if (this.showCapitals() && region.capitalPoint) {
      rows.push({ name: this.capitalHeader(), value: region.capitalPoint.name });
    }
    this.tooltip.set({
      x,
      y,
      placement: mapTooltipPlacement(x, this.width()),
      title: region.name,
      rows,
    });
  }

  protected showMarkerTooltip(marker: MapMarkerView): void {
    const k = this.width() / VENEZUELA_VIEWBOX.width;
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
    this.regionClick.emit({ id: region.id, name: region.name, value: region.value });
  }

  protected activateMarker(index: number, event?: Event): void {
    event?.preventDefault();
    const marker = this.markers()[index];
    if (marker) this.markerClick.emit(marker);
  }
}
