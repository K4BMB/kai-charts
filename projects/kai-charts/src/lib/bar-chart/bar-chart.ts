import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { KcChartState } from '../core/chart-state';
import { KcChartTable } from '../core/chart-table';
import { KC_CONFIG } from '../core/config';
import { createValueFormatter } from '../core/format';
import { KcLegend, LegendItem } from '../core/legend';
import { seriesColor } from '../core/palette';
import { observeWidth } from '../core/resize';
import { KcTooltip, TooltipState } from '../core/tooltip';
import { ChartPointEvent, ChartSeries, Orientation, ValueFormat } from '../core/types';
import { BarShape, ResolvedSeries, computeBarLayout } from './bar-layout';

/** `showLegend` accepts `true`, `false` or `'auto'` (legend only when there are 2+ series). */
function legendAttribute(value: unknown): boolean | 'auto' {
  return value === 'auto' || value === undefined ? 'auto' : booleanAttribute(value);
}

/**
 * Bar chart: vertical or horizontal, grouped or stacked. Pure SVG, responsive to its
 * container width, themed through `--kc-*` CSS tokens.
 *
 * ```html
 * <kc-bar-chart [categories]="categories" [series]="series" label="Trámites por tipo" />
 * ```
 */
@Component({
  selector: 'kc-bar-chart',
  imports: [KcChartState, KcChartTable, KcLegend, KcTooltip],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
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

  /** No categories, no series, or every value is null/undefined. Zeros are data. */
  protected readonly isEmpty = computed(
    () =>
      this.categories().length === 0 ||
      !this.series().some((s) => s.data.some((value) => value != null)),
  );

  protected readonly legendItems = computed<LegendItem[]>(() => {
    const hidden = this.hiddenSeries();
    return this.series().map((s, i) => ({
      name: s.name,
      color: seriesColor(i, s.color),
      hidden: hidden.has(s.name),
    }));
  });

  protected readonly legendVisible = computed(() => {
    const mode = this.showLegend();
    return mode === 'auto' ? this.series().length > 1 : mode;
  });

  private readonly visibleSeries = computed<ResolvedSeries[]>(() => {
    const hidden = this.hiddenSeries();
    return this.series()
      .map((s, index) => ({
        index,
        name: s.name,
        color: seriesColor(index, s.color),
        data: s.data,
      }))
      .filter((s) => !hidden.has(s.name));
  });

  protected readonly layout = computed(() =>
    computeBarLayout({
      width: this.width(),
      height: this.height(),
      horizontal: this.orientation() === 'horizontal',
      stacked: this.stacked(),
      showValues: this.showValues(),
      barRadius: this.barRadius(),
      categories: this.categories(),
      series: this.visibleSeries(),
      format: this.formatter(),
    }),
  );

  protected showTooltip(bar: BarShape): void {
    const layout = this.layout();
    const format = this.formatter();
    const rows = this.visibleSeries().map((s) => {
      const value = s.data[bar.categoryIndex];
      return {
        name: s.name,
        value: value == null ? '—' : format(value),
        color: s.color,
        active: s.index === bar.seriesIndex,
      };
    });
    if (layout.horizontal) {
      const end = bar.x + bar.w;
      this.tooltip.set({
        x: end,
        y: bar.y + bar.h / 2,
        placement: end > layout.width * 0.7 ? 'left' : 'right',
        title: bar.category,
        rows,
      });
    } else {
      this.tooltip.set({
        x: bar.x + bar.w / 2,
        y: bar.y,
        placement: 'top',
        title: bar.category,
        rows,
      });
    }
  }

  protected hideTooltip(): void {
    this.tooltip.set(null);
  }

  protected toggleSeries(index: number): void {
    const name = this.series()[index]?.name;
    if (name === undefined) return;
    const next = new Set(this.hiddenSeries());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.hiddenSeries.set(next);
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
