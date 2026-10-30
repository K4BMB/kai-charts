import { createValueFormatter } from './format.js';
import { TableColumn, TableRow, buildTableModel } from './ranking-table.js';

const es = createValueFormatter('es-VE');
const columns: TableColumn[] = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => `${v} min` },
  { key: 'days', header: 'Jornadas' },
  { key: 'note', header: 'Nota', type: 'text' },
];
const rows: TableRow[] = [
  { label: 'Lara', sublabel: 'UM-LAR-04', values: { procedures: 4019, avg: 21, days: 11 } },
  {
    id: 'VE-V',
    label: 'Zulia',
    sublabel: 'UM-ZUL-02',
    values: { procedures: 4620, avg: 18, days: 14 },
  },
  {
    label: 'Carabobo',
    values: { procedures: 4355, avg: 22, days: 11, note: 'Nueva unidad' },
    color: 'teal',
  },
  { label: 'Dtto. Capital', values: { procedures: 3980, avg: null, days: 10 } },
];

describe('buildTableModel', () => {
  it('keeps presenter order by default and formats cells with es-VE or the column format', () => {
    const model = buildTableModel(rows, columns, es, 'es-VE');
    expect(model.rows.map((r) => r.label)).toEqual(['Lara', 'Zulia', 'Carabobo', 'Dtto. Capital']);
    expect(model.rows[0].cells.map((c) => c.text)).toEqual(['4.019', '21 min', '11', '—']);
    expect(model.rows[3].cells[1].text).toBe('—');
    expect(model.rows[2].cells[3]).toMatchObject({ text: 'Nueva unidad', align: 'left' });
    expect(model.headers.map((h) => h.align)).toEqual(['right', 'right', 'right', 'left']);
  });

  it('sorts by a column, limits, ranks and marks the sorted header', () => {
    const model = buildTableModel(rows, columns, es, 'es-VE', { sortBy: 'procedures', limit: 3 });
    expect(model.rows.map((r) => [r.rank, r.label])).toEqual([
      [1, 'Zulia'],
      [2, 'Carabobo'],
      [3, 'Lara'],
    ]);
    expect(model.headers[0].sorted).toBe('desc');
    expect(model.headers[1].sorted).toBeNull();
    const asc = buildTableModel(rows, columns, es, 'es-VE', {
      sortBy: 'avg',
      sortDirection: 'asc',
    });
    expect(asc.rows.map((r) => r.label)).toEqual(['Zulia', 'Lara', 'Carabobo', 'Dtto. Capital']); // null last
  });

  it('computes bar percentages only for bar columns, relative to the visible rows', () => {
    const model = buildTableModel(rows, columns, es, 'es-VE', { sortBy: 'procedures' });
    expect(model.rows[0].cells[0].percent).toBe(100);
    expect(model.rows[1].cells[0].percent).toBeCloseTo(94.26, 2);
    expect(model.rows[0].cells[1].percent).toBeNull();
  });

  it('resolves ids, colors, the active row and an aria label', () => {
    const model = buildTableModel(rows, columns, es, 'es-VE', { activeId: 'VE-V' });
    expect(model.rows[1]).toMatchObject({ id: 'VE-V', active: true, sublabel: 'UM-ZUL-02' });
    expect(model.rows[0]).toMatchObject({
      id: 'Lara',
      active: false,
      color: 'var(--kc-color-1, #2563eb)',
    });
    expect(model.rows[2].color).toBe('teal');
    expect(model.rows[1].ariaLabel).toBe('2. Zulia: procedures 4.620, avg 18 min, days 14, note —');
  });

  it('survives empty input', () => {
    expect(buildTableModel([], columns, es, 'es-VE').rows).toEqual([]);
    expect(buildTableModel([], columns, es, 'es-VE').headers).toHaveLength(4);
  });
});
