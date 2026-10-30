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
  ChartPointEvent,
  ChartSeries,
  CurveType,
  LinePoint,
  TooltipState,
  ValueFormat,
  categoryTooltip,
  computeLineLayout,
  createValueFormatter,
  isEmptyData,
  isLegendVisible,
  resolveSeries,
  toLegendItems,
  toggleHidden,
} from 'kai-charts-core';
import { legendAttribute } from '../core/attributes';
import { KcChartState } from '../core/chart-state';
import { KcChartTable } from '../core/chart-table';
import { KC_CONFIG } from '../core/config';
import { KcLegend } from '../core/legend';
import { observeWidth } from '../core/resize';
import { KcTooltip } from '../core/tooltip';

/**
 * Line chart: one or more series over shared categories, straight or monotone-smooth
 * (never overshoots the data), optional soft area and end values. `null` values break the
 * line. Pure SVG, responsive to its container width; all geometry comes from
 * `kai-charts-core` (`computeLineLayout`).
 *
 * ```html
 * <kc-line-chart [categories]="months" [series]="series" area showEndValues label="Jornadas" />
 * ```
 */
@Component({
  selector: 'kc-line-chart',
  imports: [KcChartState, KcChartTable, KcLegend, KcTooltip],
  templateUrl: './line-chart.html',
  styles: `
    @import 'kai-charts-core/styles/line-chart.css';
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'kc-chart kc-line-chart' },
})
export class KcLineChart {
  private readonly config = inject(KC_CONFIG);
  private readonly width = observeWidth(600);

  /** Category labels along the x axis. */
  readonly categories = input<readonly string[]>([]);
  /** One or more series, each with one value per category (`null` = gap). */
  readonly series = input<readonly ChartSeries[]>([]);
  /** `smooth` = monotone cubic (default); `linear` = straight segments. */
  readonly curve = input<CurveType>('smooth');
  /** Soft fill between each line and the baseline. */
  readonly area = input(false, { transform: booleanAttribute });
  /** Force the value axis to include zero; `false` zooms into the data range. */
  readonly includeZero = input(true, { transform: booleanAttribute });
  /** Chart height in px. Width always follows the container. */
  readonly height = input(280, { transform: numberAttribute });
  readonly showLegend = input<boolean | 'auto', unknown>('auto', { transform: legendAttribute });
  readonly showGrid = input(true, { transform: booleanAttribute });
  /** Hide the value axis ticks (the mockup look); grid lines are still drawn. */
  readonly showValueAxis = input(true, { transform: booleanAttribute });
  /** Hide the category labels. */
  readonly showCategoryAxis = input(true, { transform: booleanAttribute });
  /** Print the last value of each series next to its last point. */
  readonly showEndValues = input(false, { transform: booleanAttribute });
  /** Radius of the points in px (they stay focusable even when tiny). */
  readonly pointRadius = input(3, { transform: numberAttribute });
  /** Render the data as an accessible, printable table below the chart. */
  readonly showTable = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  /** Accessible name of the chart; also used as the table caption. */
  readonly label = input('');
  /** Header of the category column in the table (defaults to the global config). */
  readonly categoryHeader = input<string | undefined>(undefined);
  /** Empty-state text (defaults to the global config). */
  readonly emptyText = input<string | undefined>(undefined);
  /** Locale for `Intl` formatting (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  /** `Intl.NumberFormat` options or a custom `(value) => string`. */
  readonly valueFormat = input<ValueFormat | undefined>(undefined);

  /** Emitted on click, Enter or Space over a point. */
  readonly pointClick = output<ChartPointEvent>();

  protected readonly tooltip = signal<TooltipState | null>(null);
  private readonly hiddenSeries = signal<ReadonlySet<string>>(new Set());

  protected readonly formatter = computed(() =>
    createValueFormatter(this.locale() ?? this.config.locale, this.valueFormat()),
  );
  protected readonly emptyLabel = computed(() => this.emptyText() ?? this.config.emptyText);
  protected readonly tableHeader = computed(
    () => this.categoryHeader() ?? this.config.categoryHeader,
  );
  protected readonly loadingText = this.config.loadingText;

  protected readonly isEmpty = computed(() => isEmptyData(this.categories(), this.series()));
  protected readonly legendItems = computed(() =>
    toLegendItems(this.series(), this.hiddenSeries()),
  );
  protected readonly legendVisible = computed(() =>
    isLegendVisible(this.showLegend(), this.series().length),
  );
  private readonly visibleSeries = computed(() =>
    resolveSeries(this.series(), this.hiddenSeries()),
  );

  protected readonly layout = computed(() =>
    computeLineLayout({
      width: this.width(),
      height: this.height(),
      categories: this.categories(),
      series: this.visibleSeries(),
      format: this.formatter(),
      curve: this.curve(),
      area: this.area(),
      includeZero: this.includeZero(),
      showValueAxis: this.showValueAxis(),
      showCategoryAxis: this.showCategoryAxis(),
      showEndValues: this.showEndValues(),
      pointRadius: this.pointRadius(),
    }),
  );

  protected showTooltip(point: LinePoint): void {
    this.tooltip.set(
      categoryTooltip(
        this.visibleSeries(),
        point.categoryIndex,
        point.seriesIndex,
        point.category,
        point.x,
        point.y,
        this.formatter(),
      ),
    );
  }

  protected hideTooltip(): void {
    this.tooltip.set(null);
  }

  protected toggleSeries(index: number): void {
    const name = this.series()[index]?.name;
    if (name !== undefined) this.hiddenSeries.set(toggleHidden(this.hiddenSeries(), name));
  }

  protected activate(point: LinePoint, event?: Event): void {
    event?.preventDefault();
    this.pointClick.emit({
      seriesIndex: point.seriesIndex,
      categoryIndex: point.categoryIndex,
      series: point.series,
      category: point.category,
      value: point.value,
    });
  }
}
