import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import {
  buildTableModel,
  createValueFormatter,
  type TableColumn,
  type TableHeaderView,
  type TableRow,
  type TableRowView,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { useKaiChartsConfig } from './config';

export type SortDirection = 'desc' | 'asc';

/** Payload of `onSortChange`: the column key and direction the host should apply. */
export interface SortChangeEvent {
  key: string;
  direction: SortDirection;
}

export interface RankingTableProps {
  /** Rows: `{ id?, label, sublabel?, color?, values: Record<key, number | string | null> }`. */
  rows?: readonly TableRow[];
  /** Columns after the label one: `{ key, header, type?, format?, bar?, align? }`. */
  columns?: readonly TableColumn[];
  /** Header of the first (label) column. */
  entityHeader?: string;
  /** Column key to sort by (controlled: header clicks only call `onSortChange`). */
  sortBy?: string;
  sortDirection?: SortDirection;
  /** Keep only the first N rows after sorting. */
  limit?: number;
  /** Id (or label when there is no id) of the row drawn as active. */
  activeId?: string;
  /** Rank badge in the first column (filled on the first row). */
  showRank?: boolean;
  /** Visible `<caption>` of the table. */
  caption?: string;
  /** Accessible name of the table when there is no caption. */
  label?: string;
  /** Locale for `Intl` formatting (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** Table-wide `Intl.NumberFormat` options or `(value) => string`; columns may override it. */
  valueFormat?: ValueFormat;
  /** Replace the rows by a skeleton with `aria-busy`. */
  loading?: boolean;
  /** Empty-state text (defaults to the provider config). */
  emptyText?: string;
  /**
   * Called on click, Enter or Space over a row with the ORIGINAL row (matched by `id`, or by
   * `label` when there is no id) and its index in `rows` (not the rendered position). Rows get
   * the `--clickable` class only when provided.
   */
  onRowClick?: (row: TableRow, index: number) => void;
  /**
   * Called when a numeric header is clicked: the same key toggles `desc → asc → desc`, another
   * key starts at `desc`. The host updates `sortBy`/`sortDirection`.
   */
  onSortChange?: (event: SortChangeEvent) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-ranking-table`). */
  className?: string;
  style?: CSSProperties;
}

const ROW_HEIGHT = 52;
const SORT_GLYPH: Record<SortDirection, string> = { desc: '▾', asc: '▴' };
const ARIA_SORT: Record<SortDirection, 'descending' | 'ascending'> = {
  desc: 'descending',
  asc: 'ascending',
};

/**
 * Ranking table: rank badge, label + sublabel column and numeric columns with per-column
 * formats and optional proportional bars. Sorting, limiting, formatting and ranks come from
 * `buildTableModel` in `kai-charts-core`; same DOM as the Angular `kc-ranking-table`.
 *
 * ```tsx
 * <RankingTable rows={units} columns={columns} sortBy={sortBy} sortDirection={direction}
 *   onSortChange={({ key, direction }) => setSort(key, direction)} />
 * ```
 */
export function RankingTable({
  rows = [],
  columns = [],
  entityHeader = 'Estado / Unidad',
  sortBy,
  sortDirection = 'desc',
  limit,
  activeId,
  showRank = true,
  caption = '',
  label = '',
  locale,
  valueFormat,
  loading = false,
  emptyText,
  onRowClick,
  onSortChange,
  className,
  style,
}: RankingTableProps) {
  const config = useKaiChartsConfig();
  const resolvedLocale = locale ?? config.locale;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const model = useMemo(
    () =>
      buildTableModel(rows, columns, formatter, resolvedLocale, {
        sortBy,
        sortDirection,
        limit,
        activeId,
      }),
    [rows, columns, formatter, resolvedLocale, sortBy, sortDirection, limit, activeId],
  );

  const clickable = onRowClick !== undefined;
  const activate = (row: TableRowView, event?: KeyboardEvent<HTMLTableRowElement>) => {
    event?.preventDefault();
    const index = rows.findIndex((candidate) => (candidate.id ?? candidate.label) === row.id);
    if (index >= 0) onRowClick?.(rows[index], index);
  };
  const onRowKeyDown = (row: TableRowView, event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(row, event);
  };
  const sort = (header: TableHeaderView) =>
    onSortChange?.({ key: header.key, direction: header.sorted === 'desc' ? 'asc' : 'desc' });
  const isSortable = (index: number) => columns[index]?.type !== 'text';

  const rootClass = className
    ? `kc-chart kc-ranking-table ${className}`
    : 'kc-chart kc-ranking-table';

  if (loading) {
    return (
      <div className={rootClass} style={style}>
        <ChartState
          kind="loading"
          height={rows.length * ROW_HEIGHT || 200}
          text={config.loadingText}
        />
      </div>
    );
  }
  if (model.rows.length === 0) {
    return (
      <div className={rootClass} style={style}>
        <ChartState kind="empty" height={120} text={emptyText ?? config.emptyText} />
      </div>
    );
  }

  return (
    <div className={rootClass} style={style}>
      <table
        className="kc-ranking-table__table"
        aria-label={caption === '' && label !== '' ? label : undefined}
      >
        {caption !== '' && <caption>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col" className="kc-align--left">
              {entityHeader}
            </th>
            {model.headers.map((header, i) => {
              const sortable = isSortable(i);
              return (
                <th
                  key={header.key}
                  scope="col"
                  className={
                    sortable
                      ? `kc-align--${header.align} kc-ranking-table__sortable`
                      : `kc-align--${header.align}`
                  }
                  aria-sort={
                    sortable ? (header.sorted ? ARIA_SORT[header.sorted] : 'none') : undefined
                  }
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="kc-ranking-table__sort-btn"
                      onClick={() => sort(header)}
                    >
                      {header.header}
                      {header.sorted && (
                        <span className="kc-ranking-table__sort" aria-hidden="true">
                          {SORT_GLYPH[header.sorted]}
                        </span>
                      )}
                    </button>
                  ) : (
                    header.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => {
            const classes = ['kc-ranking-table__row'];
            if (row.rank === 1) classes.push('kc-ranking-table__row--first');
            if (row.active) classes.push('kc-ranking-table__row--active');
            if (clickable) classes.push('kc-ranking-table__row--clickable');
            return (
              <tr
                key={row.id}
                className={classes.join(' ')}
                style={{ '--kc-row-color': row.color } as CSSProperties}
                tabIndex={0}
                aria-label={row.ariaLabel}
                data-id={row.id}
                onClick={clickable ? () => activate(row) : undefined}
                onKeyDown={clickable ? (event) => onRowKeyDown(row, event) : undefined}
              >
                <td className="kc-align--left">
                  <div className="kc-ranking-table__entity">
                    {showRank && (
                      <span className="kc-ranking-table__rank" aria-hidden="true">
                        {row.rank}
                      </span>
                    )}
                    <div>
                      <div className="kc-ranking-table__label">{row.label}</div>
                      {row.sublabel && (
                        <div className="kc-ranking-table__sublabel">{row.sublabel}</div>
                      )}
                    </div>
                  </div>
                </td>
                {row.cells.map((cell) => (
                  <td key={cell.key} className={`kc-align--${cell.align}`}>
                    <span className="kc-ranking-table__value">
                      <span className="kc-ranking-table__text">{cell.text}</span>
                      {cell.percent !== null && (
                        <i
                          className="kc-ranking-table__bar"
                          style={{ width: `${cell.percent}%` }}
                        />
                      )}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
