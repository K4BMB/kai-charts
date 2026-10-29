import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  numberAttribute,
} from '@angular/core';

/** Loading skeleton or empty placeholder, sized like the chart it replaces. */
@Component({
  selector: 'kc-chart-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (kind() === 'loading') {
      <div
        class="kc-state kc-state--loading"
        role="status"
        aria-busy="true"
        [style.height.px]="height()"
      >
        <span class="kc-state__shimmer"></span>
        <span class="kc-sr-only">{{ text() }}</span>
      </div>
    } @else {
      <div class="kc-state kc-state--empty" role="status" [style.height.px]="height()">
        {{ text() }}
      </div>
    }
  `,
  styles: `
    @import 'kai-charts-core/styles/chart-state.css';
    kc-chart-state {
      display: block;
    }
  `,
})
export class KcChartState {
  readonly kind = input.required<'loading' | 'empty'>();
  readonly height = input(240, { transform: numberAttribute });
  readonly text = input('');
}
