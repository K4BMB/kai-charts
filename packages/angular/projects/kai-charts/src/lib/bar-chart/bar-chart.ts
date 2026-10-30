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
  BarShape,
  ChartPointEvent,
  ChartSeries,
  Orientation,
  TooltipState,
  ValueFormat,
  barTooltip,
  computeBarLayout,
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
 * Bar chart: vertical or horizontal, grouped or stacked. Pure SVG, responsive to its
 * container width, themed through `--kc-*` CSS tokens. All geometry comes from
 * `kai-charts-core`; this component only wires signals to the template.
 *
 * ```html
 * <kc-bar-chart [categories]="categories" [series]="series" label="Trámites por tipo" />
 * ```
 */
@Component({
  selector: 'kc-bar-chart',
  imports: [KcChartState, KcChartTable, KcLegend, KcTooltip],
  templateUrl: './bar-chart.html',
  styles: `
    @import 'kai-charts-core/styles/bar-chart.css';
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'kc-chart kc-bar-chart' },
})
export class KcBarChart {
  private readonly config = inject(KC_CONFIG);
  private readonly width = observeWidth(600);

  /** Category labels (x axis when vertical, y axis when horizontal). */
  readonly categories = input<readonly string[]>([]);
  /** One or more series, each with one value per category. */
  readonly series = input<readonly ChartSeries[]>([]);
  readonly orientation = input<Orientation>('vertical');
  /** Stack the series instead of placing them side by side. */
  readonly stacked = input(false, { transform: booleanAttribute });
  /** Chart height in px. Width always follows the container. */
  readonly height = input(280, { transform: numberAttribute });
  readonly showLegend = input<boolean | 'auto', unknown>('auto', { transform: legendAttribute });
  /** Print the value at the end of each bar (the total when stacked). */
  readonly showValues = input(false, { transform: booleanAttribute });
  readonly showGrid = input(true, { transform: booleanAttribute });
  /** Hide the value axis ticks (the mockup look); grid lines are still drawn. */
  readonly showValueAxis = input(true, { transform: booleanAttribute });
  /** Hide the category labels. */
  readonly showCategoryAxis = input(true, { transform: booleanAttribute });
  /** Share of each category band occupied by bars, 0.1–1. Thin bars: `0.25`. */
  readonly barWidth = input(0.7, { transform: numberAttribute });
  /** Stacked only: round the outer corners of each stack with `barRadius`. */
  readonly roundStackTop = input(false, { transform: booleanAttribute });
  /** Render the data as an accessible, printable table below the chart. */
  readonly showTable = input(false, { transform: booleanAttribute });
  readonly barRadius = input(2, { transform: numberAttribute });
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

  /** Emitted on click, Enter or Space over a bar. */
  readonly barClick = output<ChartPointEvent>();

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
    computeBarLayout({
      width: this.width(),
      height: this.height(),
      horizontal: this.orientation() === 'horizontal',
      stacked: this.stacked(),
      showValues: this.showValues(),
      barRadius: this.barRadius(),
      barWidth: this.barWidth(),
      showValueAxis: this.showValueAxis(),
      showCategoryAxis: this.showCategoryAxis(),
      roundStackTop: this.roundStackTop(),
      categories: this.categories(),
      series: this.visibleSeries(),
      format: this.formatter(),
    }),
  );

  protected showTooltip(bar: BarShape): void {
    this.tooltip.set(barTooltip(this.layout(), this.visibleSeries(), bar, this.formatter()));
  }

  protected hideTooltip(): void {
    this.tooltip.set(null);
  }

  protected toggleSeries(index: number): void {
    const name = this.series()[index]?.name;
    if (name !== undefined) this.hiddenSeries.set(toggleHidden(this.hiddenSeries(), name));
  }

  protected activate(bar: BarShape, event?: Event): void {
    event?.preventDefault();
    this.barClick.emit({
      seriesIndex: bar.seriesIndex,
      categoryIndex: bar.categoryIndex,
      series: bar.series,
      category: bar.category,
      value: bar.value,
    });
  }
}
