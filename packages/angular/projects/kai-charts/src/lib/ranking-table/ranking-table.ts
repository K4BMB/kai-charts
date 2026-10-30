import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  TableColumn,
  TableHeaderView,
  TableRow,
  TableRowView,
  ValueFormat,
  buildTableModel,
  createValueFormatter,
} from 'kai-charts-core';
import { optionalNumberAttribute } from '../core/attributes';
import { KcChartState } from '../core/chart-state';
import { KC_CONFIG } from '../core/config';
import { ItemClickEvent } from '../core/events';

/** Payload of `sortChange`: the column key and the direction the host should apply. */
export interface SortChangeEvent {
  key: string;
  direction: 'desc' | 'asc';
}

/** Header view plus whether it carries a sort button (numeric columns only). */
interface SortableHeader extends TableHeaderView {
  sortable: boolean;
}

/**
 * Ranking table: rank badge, label/sublabel column and numeric columns with optional
 * proportional bars. Sorting, limiting, formatting and ranks come from `buildTableModel` of
 * `kai-charts-core`.
 *
 * Sorting is controlled: a click on a numeric header emits `sortChange` (same key toggles
 * `desc → asc → desc`, a new key starts `desc`) and the host updates `sortBy`/`sortDirection`.
 * Rows are always focusable and emit `rowClick` with the ORIGINAL row (matched by `id`, falling
 * back to `label`) and its index in `rows`.
 *
 * ```html
 * <kc-ranking-table [rows]="units" [columns]="columns" [sortBy]="sortBy()"
 *   (sortChange)="sortBy.set($event.key)" />
 * ```
 */
@Component({
  selector: 'kc-ranking-table',
  imports: [KcChartState],
  templateUrl: './ranking-table.html',
  styles: `
    @import 'kai-charts-core/styles/ranking-table.css';
    kc-ranking-table {
      display: block;
    }
    .kc-ranking-table__sort-btn {
      all: unset;
      cursor: pointer;
      font: inherit;
      color: inherit;
      text-transform: inherit;
      letter-spacing: inherit;
    }
    .kc-ranking-table__sort-btn:focus-visible {
      outline: 2px solid var(--kc-focus, currentColor);
      outline-offset: 2px;
      border-radius: 4px;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-ranking-table',
  },
})
export class KcRankingTable {
  private readonly config = inject(KC_CONFIG);

  /** Rows in presenter order; `values` is keyed by column `key`. */
  readonly rows = input<readonly TableRow[]>([]);
  /** Columns after the label column. */
  readonly columns = input<readonly TableColumn[]>([]);
  /** Header of the first (label) column. */
  readonly entityHeader = input('Estado / Unidad');
  /** Column key to sort by (none = presenter order). */
  readonly sortBy = input<string | undefined>(undefined);
  readonly sortDirection = input<'desc' | 'asc'>('desc');
  /** Keep only the first N rows after sorting (Top N). */
  readonly limit = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** Id (or label) of the row drawn as active. */
  readonly activeId = input<string | undefined>(undefined);
  /** Show the rank badge in the first column. */
  readonly showRank = input(true, { transform: booleanAttribute });
  /** Visible `<caption>` of the table. */
  readonly caption = input('');
  /** Accessible name of the table when there is no caption. */
  readonly label = input('');
  /** Locale for `Intl` formatting (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  /** `Intl.NumberFormat` options or a custom `(value) => string` for numeric cells. */
  readonly valueFormat = input<ValueFormat | undefined>(undefined);
  readonly loading = input(false, { transform: booleanAttribute });
  /** Empty-state text (defaults to the global config). */
  readonly emptyText = input<string | undefined>(undefined);

  /** Emitted on click, Enter or Space over a row with the original row and its index. */
  readonly rowClick = output<ItemClickEvent<TableRow>>();
  /** Emitted by a click on a numeric header; the host must update `sortBy`/`sortDirection`. */
  readonly sortChange = output<SortChangeEvent>();

  private readonly resolvedLocale = computed(() => this.locale() ?? this.config.locale);
  private readonly formatter = computed(() =>
    createValueFormatter(this.resolvedLocale(), this.valueFormat()),
  );
  protected readonly emptyLabel = computed(() => this.emptyText() ?? this.config.emptyText);
  protected readonly loadingText = this.config.loadingText;

  protected readonly isEmpty = computed(() => this.rows().length === 0);
  protected readonly skeletonHeight = computed(() => this.rows().length * 52 || 200);

  protected readonly model = computed(() =>
    buildTableModel(this.rows(), this.columns(), this.formatter(), this.resolvedLocale(), {
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      limit: this.limit(),
      activeId: this.activeId(),
    }),
  );

  /** Headers with the sort button only on numeric columns (`type` other than `text`). */
  protected readonly headers = computed<SortableHeader[]>(() => {
    const types = new Map(this.columns().map((c) => [c.key, c.type ?? 'number']));
    return this.model().headers.map((h) => ({ ...h, sortable: types.get(h.key) !== 'text' }));
  });

  protected ariaSort(header: SortableHeader): 'descending' | 'ascending' | 'none' | null {
    if (!header.sortable) return null;
    return header.sorted === 'desc' ? 'descending' : header.sorted === 'asc' ? 'ascending' : 'none';
  }

  protected sort(header: SortableHeader): void {
    const direction =
      this.sortBy() === header.key && this.sortDirection() === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit({ key: header.key, direction });
  }

  protected activate(row: TableRowView, event?: Event): void {
    event?.preventDefault();
    const rows = this.rows();
    const index = rows.findIndex((r) => (r.id ?? r.label) === row.id);
    if (index >= 0) this.rowClick.emit({ item: rows[index], index });
  }
}
