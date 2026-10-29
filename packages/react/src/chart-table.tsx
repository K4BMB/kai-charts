import type { ChartSeries, ValueFormatter } from 'kai-charts-core';

export interface ChartTableProps {
  categories: readonly string[];
  series: readonly ChartSeries[];
  /** Formatter shared with the chart so cells match the axis and the tooltip. */
  format: ValueFormatter;
  /** Table caption; usually the chart label. Omitted when empty. */
  caption?: string;
  /** Header of the first (category) column. */
  categoryHeader?: string;
}

/**
 * Mirror table of a chart: the same data as an accessible, printable `<table>`.
 * Rendered by charts when `showTable` is on.
 */
export function ChartTable({
  categories,
  series,
  format,
  caption = '',
  categoryHeader = '',
}: ChartTableProps) {
  return (
    <div className="kc-table-wrap">
      <table className="kc-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">{categoryHeader}</th>
            {series.map((s, index) => (
              <th key={index} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{category}</th>
              {series.map((s, colIndex) => {
                const value = s.data[rowIndex];
                return <td key={colIndex}>{value == null ? '—' : format(value)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
