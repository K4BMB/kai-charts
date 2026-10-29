import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';

export interface LegendItem {
  name: string;
  color: string;
  hidden?: boolean;
}

/** Series legend. Clicking an item emits its index so the chart can toggle the series. */
@Component({
  selector: 'kc-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    :host {
      display: block;
    }
    .kc-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px 12px;
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
    }
    .kc-legend__item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 4px;
      border: 0;
      border-radius: var(--kc-radius, 6px);
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .kc-legend__item:disabled {
      cursor: default;
    }
    .kc-legend__item:focus-visible {
      outline: 2px solid var(--kc-focus, currentColor);
      outline-offset: 2px;
    }
    .kc-legend__item--hidden {
      opacity: 0.45;
      text-decoration: line-through;
    }
    .kc-legend__swatch {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  `,
})
export class KcLegend {
  readonly items = input.required<readonly LegendItem[]>();
  readonly interactive = input(true, { transform: booleanAttribute });
  readonly toggle = output<number>();
}
