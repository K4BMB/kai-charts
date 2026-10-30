import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { TrendView } from 'kai-charts-core';

/**
 * Trend chip shared by the KPI card and the ring chart: arrow + formatted variation, colored
 * by tone. It renders the contract fragment (`span.kc-trend`) as its only child; the host is
 * `display: contents` so the span takes part in the parent layout directly.
 *
 * ```html
 * <kc-trend-chip [trend]="describeTrend(0.12, 'es-VE')" />
 * ```
 */
@Component({
  selector: 'kc-trend-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @let t = trend();
    <span [class]="'kc-trend kc-trend--' + t.direction + ' kc-tone--' + t.tone">
      <svg
        class="kc-trend__arrow"
        viewBox="0 0 12 12"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 9 9 3M4.5 3H9v4.5" />
      </svg>
      <span>{{ t.text }}</span>
    </span>
  `,
  styles: `
    @import 'kai-charts-core/styles/trend.css';
    kc-trend-chip {
      display: contents;
    }
  `,
})
export class KcTrendChip {
  /** Output of `describeTrend()` from `kai-charts-core`. */
  readonly trend = input.required<TrendView>();
}
