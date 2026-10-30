import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ItemClickEvent,
  KC_DEFAULT_PALETTE,
  KcRankingList,
  RankingItem,
  RankingSort,
} from 'kai-charts';
import { CITIZENS_BY_STATE } from '../../sample-data';
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

const COLUMNS: readonly RowsColumn[] = [
  { key: 'label', header: 'Etiqueta', type: 'text' },
  { key: 'sublabel', header: 'Subetiqueta', type: 'text' },
  { key: 'value', header: 'Valor', type: 'number', random: { min: 0, max: 6000 } },
  // Every bar uses the first palette color unless the row sets its own.
  { key: 'color', header: 'Color', type: 'color', fallbackColor: () => KC_DEFAULT_PALETTE[0] },
];

/** Sandbox of `kc-ranking-list`: editable rows, Top N / sort options, `itemClick`. */
@Component({
  selector: 'app-ranking-sandbox',
  imports: [KcRankingList, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './ranking-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingSandbox {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal<EditorRow[]>(
    CITIZENS_BY_STATE.map((item) => ({
      id: item.id ?? '',
      label: item.label,
      sublabel: item.sublabel ?? '',
      value: item.value,
      color: item.color ?? '',
    })),
  );

  // Options
  protected readonly limit = signal<number | undefined>(undefined);
  protected readonly sort = signal<RankingSort>('desc');
  protected readonly showBars = signal(true);
  protected readonly showRank = signal(true);
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly label = signal('Ciudadanos atendidos por estado');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly items = computed<RankingItem[]>(() =>
    this.rows().map((r) => ({
      id: cellString(r['id']) || undefined,
      label: cellString(r['label']) || 'Fila',
      sublabel: cellString(r['sublabel']) || undefined,
      value: cellNumber(r['value']) ?? 0,
      color: cellString(r['color']) || undefined,
    })),
  );
  protected readonly chartItems = computed<RankingItem[]>(() => (this.empty() ? [] : this.items()));
  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected readonly setOptionalNumber = setOptionalNumber;

  protected onItemClick({ item }: ItemClickEvent<RankingItem>): void {
    this.lastEvent.set({ name: 'itemClick', summary: `${item.label} = ${item.value}` });
  }

  private buildSnippet(): string {
    const attrs = ['[items]="items"'];
    if (this.limit() !== undefined) attrs.push(attr('limit', String(this.limit())));
    if (this.sort() !== 'desc') attrs.push(attr('sort', this.sort()));
    if (!this.showBars()) attrs.push(bind('showBars', false));
    if (!this.showRank()) attrs.push(bind('showRank', false));
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(itemClick)="onItemClick($event)"');
    return [
      element('kc-ranking-list', attrs),
      '',
      tsConst('items', 'RankingItem', this.items()),
    ].join('\n');
  }
}
