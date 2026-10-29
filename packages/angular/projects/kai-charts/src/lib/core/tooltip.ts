import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { TooltipState } from 'kai-charts-core';

/**
 * Visual tooltip positioned inside the chart plot. It is `aria-hidden`: the data point that
 * opens it already carries the same information in its `aria-label`.
 */
@Component({
  selector: 'kc-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (state(); as s) {
      <div
        class="kc-tooltip"
        [class.kc-tooltip--right]="s.placement === 'right'"
        [class.kc-tooltip--left]="s.placement === 'left'"
        [style.left.px]="s.x"
        [style.top.px]="s.y"
        aria-hidden="true"
      >
        <div class="kc-tooltip__title">{{ s.title }}</div>
        @for (row of s.rows; track $index) {
          <div class="kc-tooltip__row" [class.kc-tooltip__row--active]="row.active">
            <span class="kc-tooltip__swatch" [style.background]="row.color"></span>
            <span class="kc-tooltip__name">{{ row.name }}</span>
            <span class="kc-tooltip__value">{{ row.value }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: `
    @import 'kai-charts-core/styles/tooltip.css';
    kc-tooltip {
      display: contents;
    }
  `,
})
export class KcTooltip {
  readonly state = input<TooltipState | null>(null);
}
