import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { TrendView, ValueFormat, createValueFormatter, describeTrend } from 'kai-charts-core';
import { optionalNumberAttribute } from '../core/attributes';
import { KC_CONFIG } from '../core/config';
import { KcTrendChip } from '../core/trend-chip';

/**
 * Marks the element projected as the icon of a `kc-kpi-card`. It carries no logic: the card
 * queries it to know whether an icon exists and renders the tinted circle only then.
 * Import it together with `KcKpiCard` wherever the icon is projected.
 *
 * ```html
 * <kc-kpi-card label="Jornadas" [value]="128">
 *   <svg kcIcon viewBox="0 0 24 24">…</svg>
 * </kc-kpi-card>
 * ```
 */
@Directive({ selector: '[kcIcon]' })
export class KcIcon {}

/**
 * KPI card: label, headline value, optional trend chip and secondary text, with an optional
 * projected icon inside an accent-tinted circle. Numbers are formatted with the chart locale;
 * strings render as-is. All derived state (trend direction/tone/text) comes from
 * `kai-charts-core`.
 *
 * ```html
 * <kc-kpi-card label="Jornadas ejecutadas" [value]="128" [trend]="0.12" subtext="vs período anterior" />
 * ```
 */
@Component({
  selector: 'kc-kpi-card',
  imports: [KcTrendChip],
  templateUrl: './kpi-card.html',
  styles: `
    @import 'kai-charts-core/styles/kpi-card.css';
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-kpi',
    '[class.kc-kpi--loading]': 'loading()',
    '[style.--kc-kpi-accent]': 'color() || null',
    '[attr.role]': 'loading() ? "status" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class KcKpiCard {
  private readonly config = inject(KC_CONFIG);
  private readonly icon = contentChild(KcIcon);

  /** Title of the indicator. */
  readonly label = input.required<string>();
  /** Headline value: numbers are formatted with `valueFormat`, strings are rendered verbatim. */
  readonly value = input<number | string | undefined>(undefined);
  /** Secondary line next to the trend (`vs período anterior`). */
  readonly subtext = input<string | undefined>('');
  /** Variation shown as a trend chip; a ratio by default (`0.12` → `+12%`). */
  readonly trend = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** `Intl.NumberFormat` options or a custom formatter for the trend (defaults to `KC_TREND_FORMAT`). */
  readonly trendFormat = input<ValueFormat | undefined>(undefined);
  /** When going down is the good news (costs, incidents, waiting time). */
  readonly invertTrend = input(false, { transform: booleanAttribute });
  /** `Intl.NumberFormat` options or a custom `(value) => string` for the headline value. */
  readonly valueFormat = input<ValueFormat | undefined>(undefined);
  /** Locale for `Intl` formatting (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  /** Accent color of the icon circle (`--kc-kpi-accent`); defaults to the first palette color. */
  readonly color = input<string | undefined>(undefined);
  /** Shows the skeleton instead of the texts. */
  readonly loading = input(false, { transform: booleanAttribute });

  protected readonly hasIcon = computed(() => this.icon() !== undefined);

  private readonly resolvedLocale = computed(() => this.locale() ?? this.config.locale);
  private readonly formatter = computed(() =>
    createValueFormatter(this.resolvedLocale(), this.valueFormat()),
  );

  protected readonly valueText = computed(() => {
    const value = this.value();
    return typeof value === 'number' ? this.formatter()(value) : (value ?? '');
  });

  protected readonly trendView = computed<TrendView | null>(() => {
    const trend = this.trend();
    if (trend === undefined || !Number.isFinite(trend)) return null;
    return describeTrend(trend, this.resolvedLocale(), this.trendFormat(), this.invertTrend());
  });

  protected readonly hasMeta = computed(() => this.trendView() !== null || !!this.subtext());
}
