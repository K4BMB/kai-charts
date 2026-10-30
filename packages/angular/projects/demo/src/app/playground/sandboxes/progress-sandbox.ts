import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ItemClickEvent, KcProgressList, ProgressItem, Tone } from 'kai-charts';
import { DENSITY } from '../../sample-data';
import { CodeBox } from '../editors/code-box';
import { inputValue, setOptionalNumber } from '../editors/dom';
import { EventStatus, SandboxEvent } from '../editors/event-status';
import { FormatFields } from '../editors/format-fields';
import {
  DEFAULT_LOCALE,
  FORMATS,
  FormatKey,
  formatLiteral,
  valueFormatFor,
} from '../editors/formats';
import { EditorRow, RowsColumn, RowsEditor, cellNumber, cellString } from '../editors/rows-editor';
import { attr, bind, element, tsConst } from '../editors/snippet';

const TONES: readonly Tone[] = ['neutral', 'success', 'warning', 'danger', 'info'];

const COLUMNS: readonly RowsColumn[] = [
  { key: 'label', header: 'Etiqueta', type: 'text' },
  { key: 'value', header: 'Valor', type: 'number', random: { min: 0, max: 25, decimals: 1 } },
  {
    key: 'tone',
    header: 'Tono',
    type: 'select',
    options: TONES.map((tone) => ({ value: tone, label: tone })),
  },
  { key: 'caption', header: 'Nota', type: 'text' },
];

/** Sandbox of `kc-progress-list`: one row per bar with its traffic-light tone, `itemClick`. */
@Component({
  selector: 'app-progress-sandbox',
  imports: [KcProgressList, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './progress-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSandbox {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal<EditorRow[]>(
    DENSITY.map((d) => ({
      label: d.label,
      value: d.value,
      tone: d.tone ?? 'neutral',
      caption: d.caption ?? '',
    })),
  );

  // Options
  protected readonly max = signal<number | undefined>(undefined);
  protected readonly showValues = signal(true);
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly label = signal('Densidad de atención por región');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly items = computed<ProgressItem[]>(() =>
    this.rows().map((r) => {
      const tone = cellString(r['tone']) as Tone;
      return {
        label: cellString(r['label']) || 'Fila',
        value: cellNumber(r['value']) ?? 0,
        tone: tone === 'neutral' ? undefined : tone,
        caption: cellString(r['caption']) || undefined,
      };
    }),
  );
  protected readonly chartItems = computed<ProgressItem[]>(() =>
    this.empty() ? [] : this.items(),
  );
  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected readonly setOptionalNumber = setOptionalNumber;

  protected onItemClick({ item }: ItemClickEvent<ProgressItem>): void {
    this.lastEvent.set({ name: 'itemClick', summary: `${item.label} = ${item.value}` });
  }

  private buildSnippet(): string {
    const attrs = ['[items]="items"'];
    if (this.max() !== undefined) attrs.push(attr('max', String(this.max())));
    if (!this.showValues()) attrs.push(bind('showValues', false));
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(itemClick)="onItemClick($event)"');
    return [
      element('kc-progress-list', attrs),
      '',
      tsConst('items', 'ProgressItem', this.items()),
    ].join('\n');
  }
}
