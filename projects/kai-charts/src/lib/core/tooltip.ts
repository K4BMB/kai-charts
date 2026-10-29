import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface TooltipRow {
  name: string;
  value: string;
  color: string;
  active?: boolean;
}

export interface TooltipState {
  /** Anchor point in px, relative to the chart plot wrapper. */
  x: number;
  y: number;
  placement: 'top' | 'right' | 'left';
  title: string;
  rows: TooltipRow[];
}

/**
 * Visual tooltip positioned inside the chart plot. It is `aria-hidden`: the data point that
 * opens it already carries the same information in its `aria-label`.
 */
@Component({
  selector: 'kc-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    :host {
      display: contents;
    }
    .kc-tooltip {
      position: absolute;
      z-index: 10;
      min-width: 120px;
      padding: 6px 10px;
      border-radius: var(--kc-radius, 6px);
      background: var(--kc-tooltip-bg, #1f2937);
      color: var(--kc-tooltip-text, #f9fafb);
      font-size: var(--kc-font-size, 12px);
      line-height: 1.4;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgb(0 0 0 / 0.18);
      transform: translate(-50%, calc(-100% - 8px));
      pointer-events: none;
    }
    .kc-tooltip--right {
      transform: translate(8px, -50%);
    }
    .kc-tooltip--left {
      transform: translate(calc(-100% - 8px), -50%);
    }
    .kc-tooltip__title {
      margin-bottom: 2px;
      font-weight: 600;
    }
    .kc-tooltip__row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .kc-tooltip__row--active {
      font-weight: 600;
    }
    .kc-tooltip__swatch {
      flex: none;
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
    .kc-tooltip__name {
      flex: 1;
      opacity: 0.85;
    }
    @media print {
      .kc-tooltip {
        display: none;
      }
    }
  `,
})
export class KcTooltip {
  readonly state = input<TooltipState | null>(null);
}
