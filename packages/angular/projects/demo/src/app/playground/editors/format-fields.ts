import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FORMAT_OPTIONS, FormatKey, LOCALES } from './formats';

/**
 * "Locale" and "Formato" selects shared by every sandbox that formats numbers. The host is
 * `display: contents` (see playground.css) so both fields sit directly in the `.options` grid.
 */
@Component({
  selector: 'app-format-fields',
  template: `
    <label class="field">
      Locale
      <select (change)="locale.set(value($event))">
        @for (l of locales; track l) {
          <option [value]="l" [selected]="l === locale()">{{ l }}</option>
        }
      </select>
    </label>
    @if (showFormat()) {
      <label class="field">
        Formato
        <select (change)="format.set($any(value($event)))">
          @for (f of formats; track f.value) {
            <option [value]="f.value" [selected]="f.value === format()">{{ f.label }}</option>
          }
        </select>
      </label>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormatFields {
  readonly locale = model.required<string>();
  readonly format = model<FormatKey>('number');
  /** The calendar only formats dates: it gets the locale without the number format. */
  readonly showFormat = input(true);

  protected readonly locales = LOCALES;
  protected readonly formats = FORMAT_OPTIONS;

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
