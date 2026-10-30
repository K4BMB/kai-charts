import { seriesColor } from './palette.js';
import { round2 } from './text.js';
import { clamp } from './tone.js';
import { ValueFormat, ValueFormatter } from './types.js';
import { createValueFormatter } from './format.js';

/** A column of a ranking table. */
export interface TableColumn {
  key: string;
  header: string;
  /** `number` cells are formatted and right-aligned; `text` cells rendered as-is. */
  type?: 'number' | 'text';
  /** Per-column format (Intl options or function). Falls back to the table formatter. */
  format?: ValueFormat;
  /** Draw a proportional bar behind the number (relative to the column maximum). */
  bar?: boolean;
  align?: 'left' | 'right' | 'center';
}

/** A row: the presenter decides the keys; `label`/`sublabel` are shown in the first column. */
export interface TableRow {
  id?: string;
  label: string;
  sublabel?: string;
  /** Any CSS color for the rank badge/bar. */
  color?: string;
  values: Record<string, number | string | null | undefined>;
}

export interface TableOptions {
  /** Column key to sort by (default: none, keep presenter order). */
  sortBy?: string;
  sortDirection?: 'desc' | 'asc';
  limit?: number;
  /** Zero-based index of the row to mark as active (e.g. the hovered state). */
  activeId?: string;
}

export interface TableCellView {
  key: string;
  text: string;
  raw: number | string | null | undefined;
  align: 'left' | 'right' | 'center';
  /** 0–100 when the column has `bar`, otherwise `null`. */
  percent: number | null;
}

export interface TableRowView {
  rank: number;
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  active: boolean;
  cells: TableCellView[];
  ariaLabel: string;
}

export interface TableHeaderView {
  key: string;
  header: string;
  align: 'left' | 'right' | 'center';
  sorted: 'desc' | 'asc' | null;
}

export interface TableModel {
  headers: TableHeaderView[];
  rows: TableRowView[];
}

/** Sorts, limits, formats and ranks the rows of a ranking table. */
export function buildTableModel(
  rows: readonly TableRow[],
  columns: readonly TableColumn[],
  format: ValueFormatter,
  locale: string,
  options: TableOptions = {},
): TableModel {
  const direction = options.sortDirection ?? 'desc';
  let list = [...rows];
  if (options.sortBy) {
    const key = options.sortBy;
    list.sort((a, b) => {
      const va = numberOf(a.values[key]);
      const vb = numberOf(b.values[key]);
      // Missing values always sink to the bottom, whatever the direction.
      if (va === null || vb === null) return va === null ? (vb === null ? 0 : 1) : -1;
      return direction === 'desc' ? vb - va : va - vb;
    });
  }
  if (options.limit && options.limit > 0) list = list.slice(0, options.limit);

  const formatters = new Map<string, ValueFormatter>();
  const maxima = new Map<string, number>();
  for (const column of columns) {
    formatters.set(
      column.key,
      column.format ? createValueFormatter(locale, column.format) : format,
    );
    if (column.bar) {
      maxima.set(column.key, Math.max(0, ...list.map((r) => numberOf(r.values[column.key]) ?? 0)));
    }
  }

  const headers: TableHeaderView[] = columns.map((c) => ({
    key: c.key,
    header: c.header,
    align: c.align ?? (c.type === 'text' ? 'left' : 'right'),
    sorted: options.sortBy === c.key ? direction : null,
  }));

  const viewRows: TableRowView[] = list.map((row, i) => {
    const id = row.id ?? row.label;
    const cells: TableCellView[] = columns.map((column) => {
      const raw = row.values[column.key];
      const isNumber = typeof raw === 'number' && Number.isFinite(raw);
      const text = raw == null ? '—' : isNumber ? formatters.get(column.key)!(raw) : String(raw);
      const max = maxima.get(column.key);
      const percent =
        column.bar && max !== undefined
          ? max > 0 && isNumber
            ? round2(clamp((raw / max) * 100, 0, 100))
            : 0
          : null;
      return {
        key: column.key,
        text,
        raw,
        align: column.align ?? (column.type === 'text' ? 'left' : 'right'),
        percent,
      };
    });
    return {
      rank: i + 1,
      id,
      label: row.label,
      sublabel: row.sublabel,
      color: row.color ?? seriesColor(0),
      active: options.activeId !== undefined && options.activeId === id,
      cells,
      ariaLabel: `${i + 1}. ${row.label}: ${cells.map((c) => `${c.key} ${c.text}`).join(', ')}`,
    };
  });

  return { headers, rows: viewRows };
}

function numberOf(value: number | string | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
