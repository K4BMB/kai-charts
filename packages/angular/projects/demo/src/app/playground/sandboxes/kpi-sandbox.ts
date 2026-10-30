import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { KC_DEFAULT_PALETTE, KcIcon, KcKpiCard } from 'kai-charts';
import { KPIS } from '../../sample-data';
import { KpiIcon } from '../../showcase/kpi-icon';
import { CodeBox } from '../editors/code-box';
import { inputValue, setOptionalNumber } from '../editors/dom';
import { EventStatus } from '../editors/event-status';
import { FormatFields } from '../editors/format-fields';
import {
  DEFAULT_LOCALE,
  FORMATS,
  FormatKey,
  formatLiteral,
  valueFormatFor,
} from '../editors/formats';
import { attr, bind } from '../editors/snippet';

const SAMPLE = KPIS[0];

/**
 * Sandbox of `kc-kpi-card`: the four texts are plain fields (no rows), the card renders inside a
 * 320 px box with the showcase calendar icon projected through `kcIcon`. The card has no events.
 */
@Component({
  selector: 'app-kpi-sandbox',
  imports: [KcKpiCard, KcIcon, KpiIcon, CodeBox, EventStatus, FormatFields],
  templateUrl: './kpi-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiSandbox {
  // Data
  protected readonly label = signal(SAMPLE.label);
  protected readonly value = signal<number | undefined>(
    typeof SAMPLE.value === 'number' ? SAMPLE.value : undefined,
  );
  protected readonly subtext = signal(SAMPLE.subtext ?? '');
  protected readonly trend = signal<number | undefined>(SAMPLE.trend);

  // Options
  protected readonly invertTrend = signal(false);
  protected readonly color = signal('');
  protected readonly loading = signal(false);
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly code = computed(() => this.buildSnippet());
  /** Swatch shown while `color` is empty (the card falls back to `--kc-color-1`). */
  protected readonly defaultColor = KC_DEFAULT_PALETTE[0];

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected readonly setOptionalNumber = setOptionalNumber;

  private buildSnippet(): string {
    const attrs = [attr('label', this.label())];
    if (this.value() !== undefined) attrs.push(bind('value', this.value()!));
    if (this.subtext()) attrs.push(attr('subtext', this.subtext()));
    if (this.trend() !== undefined) attrs.push(bind('trend', this.trend()!));
    if (this.invertTrend()) attrs.push('invertTrend');
    if (this.color()) attrs.push(attr('color', this.color()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    return [
      `<kc-kpi-card\n  ${attrs.join('\n  ')}\n>`,
      '  <!-- Optional icon: any element with the kcIcon attribute -->',
      '  <svg kcIcon viewBox="0 0 24 24" aria-hidden="true">…</svg>',
      '</kc-kpi-card>',
    ].join('\n');
  }
}
