import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ItemClickEvent, KcRingChart, RingItem, ValueFormat } from 'kai-charts';
import { RINGS } from '../../sample-data';
import { CodeBox } from '../editors/code-box';
import { inputValue, setOptionalNumber } from '../editors/dom';
import { EventStatus, SandboxEvent } from '../editors/event-status';
import { FormatFields } from '../editors/format-fields';
import { DEFAULT_LOCALE, FORMATS, FormatKey, formatLiteral } from '../editors/formats';
import { EditorRow, RowsColumn, RowsEditor, cellNumber, cellString } from '../editors/rows-editor';
import { attr, bind, element, tsConst } from '../editors/snippet';

/** The ring chart formats ratios as percentages with one decimal by default. */
const RING_FORMAT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

const COLUMNS: readonly RowsColumn[] = [
  { key: 'name', header: 'Nombre', type: 'text' },
  { key: 'value', header: 'Valor', type: 'number', random: { min: 0, max: 1, decimals: 3 } },
  { key: 'max', header: 'Máximo', type: 'number', random: false },
  { key: 'color', header: 'Color', type: 'color' },
];

/** Sandbox of `kc-ring-chart`: one editable row per ring, center texts, `ringClick`. */
@Component({
  selector: 'app-ring-sandbox',
  imports: [KcRingChart, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './ring-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RingSandbox {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal<EditorRow[]>(
    RINGS.map((r) => ({ name: r.name, value: r.value, max: r.max ?? 1, color: r.color ?? '' })),
  );

  // Options
  protected readonly size = signal(200);
  protected readonly thickness = signal(0);
  protected readonly gap = signal(4);
  protected readonly centerLabel = signal('Saldo');
  protected readonly centerValue = signal<number | undefined>(0.917);
  protected readonly centerTrend = signal<number | undefined>(0.038);
  protected readonly invertTrend = signal(false);
  protected readonly showLegend = signal(true);
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly label = signal('Atención nacional');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('percent');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly items = computed<RingItem[]>(() =>
    this.rows().map((r) => {
      const max = cellNumber(r['max']);
      return {
        name: cellString(r['name']) || 'Anillo',
        value: cellNumber(r['value']) ?? 0,
        max: max === undefined || max === 1 ? undefined : max,
        color: cellString(r['color']) || undefined,
      };
    }),
  );
  protected readonly chartItems = computed<RingItem[]>(() => (this.empty() ? [] : this.items()));
  protected readonly valueFormat = computed<ValueFormat>(() =>
    this.format() === 'percent' ? RING_FORMAT : FORMATS[this.format()],
  );
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected readonly setOptionalNumber = setOptionalNumber;

  protected onRingClick({ item }: ItemClickEvent<RingItem>): void {
    this.lastEvent.set({ name: 'ringClick', summary: `${item.name} = ${item.value}` });
  }

  private buildSnippet(): string {
    const attrs = ['[items]="items"'];
    if (this.size() !== 200) attrs.push(attr('size', String(this.size())));
    if (this.thickness() > 0) attrs.push(attr('thickness', String(this.thickness())));
    if (this.gap() !== 4) attrs.push(attr('gap', String(this.gap())));
    if (this.centerLabel()) attrs.push(attr('centerLabel', this.centerLabel()));
    if (this.centerValue() !== undefined) attrs.push(bind('centerValue', this.centerValue()!));
    if (this.centerTrend() !== undefined) attrs.push(bind('centerTrend', this.centerTrend()!));
    if (this.invertTrend()) attrs.push('invertTrend');
    if (!this.showLegend()) attrs.push(bind('showLegend', false));
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'percent')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(ringClick)="onRingClick($event)"');
    return [element('kc-ring-chart', attrs), '', tsConst('items', 'RingItem', this.items())].join(
      '\n',
    );
  }
}
