import { parseNumber, useCopy } from './shared';

export type CellValue = string | number | null | undefined;
export type ColumnType = 'text' | 'number' | 'color' | 'select';

/** A typed column of the rows editor; `key` is the row member it edits. */
export interface RowsColumn<T extends Record<string, CellValue>> {
  key: keyof T & string;
  label: string;
  type: ColumnType;
  /** `select` columns: the choices. */
  options?: readonly { value: string; label: string }[];
  /** `number` columns: how "Aleatorio" re-rolls the cell; columns without it keep their value. */
  random?: () => number;
  /** `color` columns: color shown while the cell is empty (automatic). */
  fallback?: (rowIndex: number) => string;
  placeholder?: string;
}

export interface RowsEditorProps<T extends Record<string, CellValue>> {
  columns: readonly RowsColumn<T>[];
  rows: readonly T[];
  onChange: (rows: T[]) => void;
  /** Builds the row appended by "+ Fila". */
  newRow: (rows: readonly T[]) => T;
  /** What "Copiar JSON" copies (default: the rows as edited). */
  json?: unknown;
  /** Optional heading above the table (`Marcadores`). */
  title?: string;
  /** Accessible name of the table. */
  label: string;
}

/**
 * Editable table with typed columns (`text` | `number` | `color` | `select`), a "Quitar" button
 * per row, "+ Fila", "Aleatorio" (re-rolls the numeric columns) and "Copiar JSON". Members of
 * the rows that are not columns (ids) pass through untouched.
 */
export function RowsEditor<T extends Record<string, CellValue>>({
  columns,
  rows,
  onChange,
  newRow,
  json,
  title,
  label,
}: RowsEditorProps<T>) {
  const [copied, copy] = useCopy();

  const setCell = (index: number, key: keyof T & string, value: CellValue) =>
    onChange(rows.map((row, i) => (i === index ? ({ ...row, [key]: value } as T) : row)));
  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index));
  const add = () => onChange([...rows, newRow(rows)]);
  const randomize = () =>
    onChange(
      rows.map((row) => {
        const next = { ...row };
        for (const column of columns) {
          if (column.type === 'number' && column.random)
            next[column.key] = column.random() as T[keyof T & string];
        }
        return next;
      }),
    );
  const copyJson = () => copy(JSON.stringify(json ?? rows, null, 2));

  const cell = (column: RowsColumn<T>, row: T, index: number) => {
    const value = row[column.key];
    const ariaLabel = `${column.label} · fila ${index + 1}`;
    switch (column.type) {
      case 'number':
        return (
          <input
            type="number"
            step="any"
            value={value ?? ''}
            placeholder={column.placeholder}
            onChange={(e) => setCell(index, column.key, parseNumber(e.target.value))}
            aria-label={ariaLabel}
          />
        );
      case 'color':
        return (
          <input
            type="color"
            value={(value as string) || column.fallback?.(index) || '#000000'}
            onChange={(e) => setCell(index, column.key, e.target.value)}
            aria-label={ariaLabel}
          />
        );
      case 'select':
        return (
          <select
            value={value ?? ''}
            onChange={(e) => setCell(index, column.key, e.target.value)}
            aria-label={ariaLabel}
          >
            {column.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value ?? ''}
            placeholder={column.placeholder}
            onChange={(e) => setCell(index, column.key, e.target.value)}
            aria-label={ariaLabel}
          />
        );
    }
  };

  return (
    <div className="rows-editor">
      {title && <h3>{title}</h3>}
      <div className="values-wrap">
        <table className="values" aria-label={label}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{cell(column, row, index)}</td>
                ))}
                <td>
                  <button type="button" className="secondary" onClick={() => remove(index)}>
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={add}>
          + Fila
        </button>
        <button type="button" onClick={randomize}>
          Aleatorio
        </button>
        <button type="button" onClick={copyJson}>
          {copied ? '¡Copiado!' : 'Copiar JSON'}
        </button>
      </div>
    </div>
  );
}
