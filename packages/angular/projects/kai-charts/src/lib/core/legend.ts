import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  output,
} from '@angular/core';
import { LegendItem } from 'kai-charts-core';

/**
 * Series legend. Clicking an item emits its index so the chart can toggle the series.
 * Styles come from `kai-charts-core/styles/legend.css` (global, `.kc-` prefixed) so the
 * same stylesheet serves every framework.
 */
@Component({
  selector: 'kc-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul class="kc-legend">
      @for (item of items(); track $index) {
        <li>
          <button
            type="button"
            class="kc-legend__item"
            [class.kc-legend__item--hidden]="item.hidden"
            [attr.aria-pressed]="interactive() ? !item.hidden : null"
            [disabled]="!interactive()"
            (click)="toggle.emit($index)"
          >
            <span
              class="kc-legend__swatch"
              [style.background]="item.color"
              aria-hidden="true"
            ></span>
            <span>{{ item.name }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    @import 'kai-charts-core/styles/legend.css';
    kc-legend {
      display: block;
    }
  `,
})
export class KcLegend {
  readonly items = input.required<readonly LegendItem[]>();
  readonly interactive = input(true, { transform: booleanAttribute });
  readonly toggle = output<number>();
}
