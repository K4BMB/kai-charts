import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KpiIcon as KpiIconName } from '../sample-data';

/**
 * Hand-drawn line icons for the KPI cards of the showcase. Projected into `kc-kpi-card` with
 * the `kcIcon` attribute on this host (`<app-kpi-icon kcIcon [name]="…" />`).
 */
@Component({
  selector: 'app-kpi-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('calendar') {
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        }
        @case ('file') {
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        }
        @case ('users') {
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.5a5 5 0 0 1 6 5" />
        }
        @case ('user-plus') {
          <circle cx="10" cy="8" r="3.5" />
          <path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
        }
        @case ('card') {
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h4" />
        }
        @case ('alert') {
          <path d="M12 4 2.5 20h19L12 4z" />
          <path d="M12 10v4M12 17.5v.5" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    svg {
      display: block;
      width: 22px;
      height: 22px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiIcon {
  readonly name = input.required<KpiIconName>();
}
