import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ItemClickEvent, KcRankingTable, SortChangeEvent, TableRow } from 'kai-charts';
import { RANKING_TABLE_COLUMNS, RANKING_TABLE_ROWS } from '../../sample-data';
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

type SortKey = 'none' | 'procedures' | 'avg' | 'days';

const COLUMNS: readonly RowsColumn[] = [
  { key: 'label', header: 'Etiqueta', type: 'text' },
  { key: 'sublabel', header: 'Subetiqueta', type: 'text' },
  { key: 'procedures', header: 'Trámites', type: 'number', random: { min: 0, max: 5000 } },
  { key: 'avg', header: 'Tiempo medio', type: 'number', random: { min: 5, max: 60 } },
  { key: 'days', header: 'Jornadas', type: 'number', random: { min: 1, max: 30 } },
];

/** `RANKING_TABLE_COLUMNS` as source: its `format` function cannot be serialised from the value. */
const COLUMNS_SNIPPET = `const columns: TableColumn[] = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => \`\${v} min\` },
  { key: 'days', header: 'Jornadas' },
];`;

/**
 * Sandbox of `kc-ranking-table`: editable rows over the fixed showcase columns, controlled sort
 * (header clicks update `sortBy`/`sortDirection`), `rowClick` and `sortChange` status.
 */
@Component({
  selector: 'app-table-sandbox',
  imports: [KcRankingTable, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './table-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSandbox {
  protected readonly columns = COLUMNS;
  protected readonly tableColumns = RANKING_TABLE_COLUMNS;
  protected readonly rows = signal<EditorRow[]>(
    RANKING_TABLE_ROWS.map((row) => ({
      id: row.id ?? '',
      label: row.label,
      sublabel: row.sublabel ?? '',
      procedures: numberOrNull(row.values['procedures']),
      avg: numberOrNull(row.values['avg']),
      days: numberOrNull(row.values['days']),
    })),
  );

  // Options
  protected readonly sortBy = signal<SortKey>('procedures');
  protected readonly sortDirection = signal<'desc' | 'asc'>('desc');
  protected readonly limit = signal<number | undefined>(undefined);
  protected readonly showRank = signal(true);
  protected readonly entityHeader = signal('Estado / Unidad');
  protected readonly caption = signal('');
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly label = signal('Ranking de eficiencia por unidad móvil');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly tableRows = computed<TableRow[]>(() =>
    this.rows().map((r) => ({
      id: cellString(r['id']) || undefined,
      label: cellString(r['label']) || 'Fila',
      sublabel: cellString(r['sublabel']) || undefined,
      values: {
        procedures: cellNumber(r['procedures']) ?? null,
        avg: cellNumber(r['avg']) ?? null,
        days: cellNumber(r['days']) ?? null,
      },
    })),
  );
  protected readonly chartRows = computed<TableRow[]>(() => (this.empty() ? [] : this.tableRows()));
  protected readonly sortKey = computed(() =>
    this.sortBy() === 'none' ? undefined : this.sortBy(),
  );
  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected readonly setOptionalNumber = setOptionalNumber;

  protected onRowClick({ item }: ItemClickEvent<TableRow>): void {
    const value = item.values['procedures'];
    this.lastEvent.set({ name: 'rowClick', summary: `${item.label} = ${value ?? '—'}` });
  }

  protected onSortChange({ key, direction }: SortChangeEvent): void {
    this.sortBy.set(key as SortKey);
    this.sortDirection.set(direction);
    this.lastEvent.set({ name: 'sortChange', summary: `${key} · ${direction}` });
  }

  private buildSnippet(): string {
    const attrs = ['[rows]="rows"', '[columns]="columns"'];
    if (this.sortBy() !== 'none') attrs.push(attr('sortBy', this.sortBy()));
    if (this.sortDirection() !== 'desc') attrs.push(attr('sortDirection', this.sortDirection()));
    if (this.limit() !== undefined) attrs.push(attr('limit', String(this.limit())));
    if (!this.showRank()) attrs.push(bind('showRank', false));
    if (this.entityHeader() !== 'Estado / Unidad')
      attrs.push(attr('entityHeader', this.entityHeader()));
    if (this.caption()) attrs.push(attr('caption', this.caption()));
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(rowClick)="onRowClick($event)"', '(sortChange)="onSortChange($event)"');
    return [
      element('kc-ranking-table', attrs),
      '',
      COLUMNS_SNIPPET,
      '',
      tsConst('rows', 'TableRow', this.tableRows()),
    ].join('\n');
  }
}

function numberOrNull(value: number | string | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}
