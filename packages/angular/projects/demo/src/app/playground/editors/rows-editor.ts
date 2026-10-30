import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';
import { KC_DEFAULT_PALETTE } from 'kai-charts';
import { copyToClipboard } from './clipboard';
import { isIncompleteNumber } from './dom';

export type CellValue = string | number | null;
/** One editable row: the sandbox decides the keys and maps them to the chart's item type. */
export type EditorRow = Record<string, CellValue>;

export type RowsColumnType = 'text' | 'number' | 'color' | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

/** Random range used by "Aleatorio" for a numeric column. */
export interface RandomRange {
  min: number;
  max: number;
  decimals?: number;
}

export interface RowsColumn {
  key: string;
  header: string;
  type: RowsColumnType;
  /** `select` only. */
  options?: readonly SelectOption[];
  /** `number` only: input attributes. */
  min?: number;
  max?: number;
  step?: number | 'any';
  /** `number` only: range of "Aleatorio" (0–200 integers by default; `false` keeps the column). */
  random?: RandomRange | false;
  /** `color` only: swatch shown while the cell is empty (palette color by row index by default). */
  fallbackColor?: (rowIndex: number) => string;
  placeholder?: string;
}

const DEFAULT_RANDOM: RandomRange = { min: 0, max: 200, decimals: 0 };

export function cellString(value: CellValue | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

export function cellNumber(value: CellValue | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function randomValue(range: RandomRange): number {
  const value = range.min + Math.random() * (range.max - range.min);
  return Number(value.toFixed(range.decimals ?? 0));
}

/**
 * Editable table with typed columns (`text` | `number` | `color` | `select`), a "Quitar" button
 * per row, "+ Fila", "Aleatorio" (re-rolls the numeric columns) and "Copiar JSON". The rows are a
 * `model()`: every edit emits a new array so OnPush charts react.
 */
@Component({
  selector: 'app-rows-editor',
  templateUrl: './rows-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowsEditor {
  readonly columns = input.required<readonly RowsColumn[]>();
  readonly rows = model.required<EditorRow[]>();
  /** Payload of "Copiar JSON" (the mapped chart data); the raw rows when omitted. */
  readonly json = input<unknown>(undefined);
  /** Builds the row appended by "+ Fila"; empty texts, random numbers and first options by default. */
  readonly newRow = input<((index: number) => EditorRow) | undefined>(undefined);
  readonly addLabel = input('+ Fila');

  protected readonly copied = signal(false);

  protected text(row: EditorRow, column: RowsColumn): string {
    return cellString(row[column.key]);
  }

  protected color(row: EditorRow, column: RowsColumn, index: number): string {
    const value = cellString(row[column.key]);
    if (value) return value;
    return column.fallbackColor?.(index) ?? KC_DEFAULT_PALETTE[index % KC_DEFAULT_PALETTE.length];
  }

  protected onCell(index: number, column: RowsColumn, event: Event): void {
    if (column.type === 'number' && isIncompleteNumber(event)) return;
    const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
    let value: CellValue = raw;
    if (column.type === 'number') {
      const trimmed = raw.trim();
      const parsed = Number(trimmed);
      value = trimmed === '' || Number.isNaN(parsed) ? null : parsed;
    }
    this.rows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [column.key]: value } : row)),
    );
  }

  protected remove(index: number): void {
    this.rows.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected add(): void {
    const index = this.rows().length;
    const row = this.newRow()?.(index) ?? this.defaultRow();
    this.rows.update((rows) => [...rows, row]);
  }

  protected randomize(): void {
    const numeric = this.columns().filter((c) => c.type === 'number' && c.random !== false);
    this.rows.update((rows) =>
      rows.map((row) => {
        const next = { ...row };
        for (const column of numeric) {
          next[column.key] = randomValue(column.random || DEFAULT_RANDOM);
        }
        return next;
      }),
    );
  }

  protected copyJson(): void {
    copyToClipboard(JSON.stringify(this.json() ?? this.rows(), null, 2));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  private defaultRow(): EditorRow {
    const row: EditorRow = {};
    for (const column of this.columns()) {
      switch (column.type) {
        case 'number':
          row[column.key] = randomValue(column.random || DEFAULT_RANDOM);
          break;
        case 'select':
          row[column.key] = column.options?.[0]?.value ?? '';
          break;
        default:
          row[column.key] = '';
      }
    }
    return row;
  }
}
