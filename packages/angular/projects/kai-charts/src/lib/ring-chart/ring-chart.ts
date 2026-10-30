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
  RingItem,
  RingShape,
  TooltipState,
  TrendView,
  ValueFormat,
  computeRingLayout,
  createValueFormatter,
  describeTrend,
} from 'kai-charts-core';
import { optionalNumberAttribute } from '../core/attributes';
import { KcChartState } from '../core/chart-state';
import { KC_CONFIG } from '../core/config';
import { ItemClickEvent } from '../core/events';
import { observeWidth } from '../core/resize';
import { KcTooltip } from '../core/tooltip';
import { KcTrendChip } from '../core/trend-chip';

/** Default `valueFormat` of the ring chart: ratios shown as percentages (`0.917` → `91,7%`). */
const RING_FORMAT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

/**
 * Concentric progress rings (outermost = first item) with an optional center label, value and
 * trend chip, plus a legend with the figure of each ring. Geometry comes from
 * `computeRingLayout` of `kai-charts-core`; the rendered width never exceeds `size`.
 *
 * ```html
 * <kc-ring-chart [items]="rings" centerLabel="Saldo" [centerValue]="0.917" [centerTrend]="0.038" />
 * ```
 */
@Component({
  selector: 'kc-ring-chart',
  imports: [KcChartState, KcTooltip, KcTrendChip],
  templateUrl: './ring-chart.html',
  styles: `
    @import 'kai-charts-core/styles/ring-chart.css';
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'kc-chart kc-ring' },
})
export class KcRingChart {
  private readonly config = inject(KC_CONFIG);
  private readonly width = observeWidth(600);

  /** One ring per item; `value / max` is the filled share (`max` defaults to 1). */
  readonly items = input<readonly RingItem[]>([]);
  /** Side of the square viewBox in px; the rendered width is at most this. */
  readonly size = input(200, { transform: numberAttribute });
  /** Stroke width of the rings (auto by default: the hole keeps ~45 % for the center text). */
  readonly thickness = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** Space between rings in px. */
  readonly gap = input(4, { transform: numberAttribute });
  /** Small text above the center value. */
  readonly centerLabel = input('');
  /** Headline value in the center: numbers are formatted with `valueFormat`, strings as-is. */
  readonly centerValue = input<number | string | undefined>(undefined);
  /** Variation shown as a trend chip under the center value. */
  readonly centerTrend = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** When going down is the good news. */
  readonly invertTrend = input(false, { transform: booleanAttribute });
  /** Name and value per ring under the figure. */
  readonly showLegend = input(true, { transform: booleanAttribute });
  /** `Intl.NumberFormat` options or a custom `(value) => string`; percent with 1 decimal by default. */
  readonly valueFormat = input<ValueFormat>(RING_FORMAT);
  /** Locale for `Intl` formatting (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  /** Accessible name of the svg. */
  readonly label = input('');
  readonly loading = input(false, { transform: booleanAttribute });
  /** Empty-state text (defaults to the global config). */
  readonly emptyText = input<string | undefined>(undefined);

  /** Emitted on click, Enter or Space over a ring with the original item and its index. */
  readonly ringClick = output<ItemClickEvent<RingItem>>();

  protected readonly tooltip = signal<TooltipState | null>(null);

  private readonly resolvedLocale = computed(() => this.locale() ?? this.config.locale);
  private readonly formatter = computed(() =>
    createValueFormatter(this.resolvedLocale(), this.valueFormat()),
  );
  protected readonly emptyLabel = computed(() => this.emptyText() ?? this.config.emptyText);
  protected readonly loadingText = this.config.loadingText;
  protected readonly isEmpty = computed(() => this.items().length === 0);

  protected readonly layout = computed(() =>
    computeRingLayout({
      size: this.size(),
      items: this.items(),
      format: this.formatter(),
      thickness: this.thickness(),
      gap: this.gap(),
    }),
  );
  protected readonly viewBox = computed(() => `0 0 ${this.size()} ${this.size()}`);

  protected readonly centerValueText = computed(() => {
    const value = this.centerValue();
    return typeof value === 'number' ? this.formatter()(value) : value;
  });
  protected readonly centerTrendView = computed<TrendView | null>(() => {
    const trend = this.centerTrend();
    if (trend === undefined || !Number.isFinite(trend)) return null;
    return describeTrend(trend, this.resolvedLocale(), undefined, this.invertTrend());
  });
  protected readonly hasCenter = computed(
    () =>
      !!this.centerLabel() ||
      this.centerValueText() !== undefined ||
      this.centerTrendView() !== null,
  );

  protected showTooltip(ring: RingShape): void {
    const { cx, cy } = this.layout();
    // The figure is at most `size` wide: scale the viewBox anchor to the rendered width.
    const k = Math.min(this.width(), this.size()) / this.size();
    this.tooltip.set({
      x: Math.round(cx * k * 100) / 100,
      y: Math.round((cy - ring.r) * k * 100) / 100,
      placement: 'top',
      title: ring.name,
      rows: [{ name: ring.name, value: ring.valueText, color: ring.color, active: true }],
    });
  }

  protected hideTooltip(): void {
    this.tooltip.set(null);
  }

  protected activate(ring: RingShape, event?: Event): void {
    event?.preventDefault();
    const item = this.items()[ring.index];
    if (item) this.ringClick.emit({ item, index: ring.index });
  }
}
