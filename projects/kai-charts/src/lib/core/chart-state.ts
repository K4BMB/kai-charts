import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/** Loading skeleton or empty placeholder, sized like the chart it replaces. */
@Component({
  selector: 'kc-chart-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    :host {
      display: block;
    }
    .kc-state {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      border-radius: var(--kc-radius, 6px);
      color: var(--kc-muted, color-mix(in srgb, currentColor 70%, transparent));
    }
    .kc-state--loading {
      position: relative;
      overflow: hidden;
      background: var(--kc-skeleton, color-mix(in srgb, currentColor 8%, transparent));
    }
    .kc-state__shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent,
        color-mix(in srgb, currentColor 8%, transparent),
        transparent
      );
      animation: kc-shimmer 1.4s infinite;
    }
    .kc-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    @keyframes kc-shimmer {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(100%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .kc-state__shimmer {
        animation: none;
      }
    }
  `,
})
export class KcChartState {
  readonly kind = input.required<'loading' | 'empty'>();
  readonly height = input(240, { transform: numberAttribute });
  readonly text = input('');
}
