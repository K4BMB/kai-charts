import { fireEvent, render } from '@testing-library/react';
import type { TableColumn, TableRow } from 'kai-charts-core';
import { RankingTable, type RankingTableProps, type SortChangeEvent } from './ranking-table';

const COLUMNS: TableColumn[] = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => `${v} min` },
  { key: 'days', header: 'Jornadas' },
];

const ROWS: TableRow[] = [
  {
    id: 'VE-V',
    label: 'Zulia',
    sublabel: 'UM-ZUL-02',
    values: { procedures: 4620, avg: 18, days: 14 },
  },
  {
    id: 'VE-K',
    label: 'Lara',
    sublabel: 'UM-LAR-04',
    values: { procedures: 4019, avg: 21, days: 11 },
  },
  {
    id: 'VE-G',
    label: 'Carabobo',
    sublabel: 'UM-CAR-04',
    values: { procedures: 4355, avg: 22, days: 11 },
  },
  {
    id: 'VE-M',
    label: 'Miranda',
    sublabel: 'UM-MIR-04',
    values: { procedures: 4290, avg: 23, days: 13 },
  },
  {
    id: 'VE-A',
    label: 'Dtto. Capital',
    sublabel: 'UM-DC-04',
    values: { procedures: 3980, avg: 27, days: 10 },
  },
];

describe('RankingTable', () => {
  let element: HTMLElement;

  function mount(props: Partial<RankingTableProps> = {}) {
    const result = render(<RankingTable rows={ROWS} columns={COLUMNS} {...props} />);
    element = result.container;
    return result;
  }

  const root = () => element.firstElementChild as HTMLElement;
  const headers = () => Array.from(element.querySelectorAll<HTMLTableCellElement>('thead th'));
  const rows = () =>
    Array.from(element.querySelectorAll<HTMLTableRowElement>('tr.kc-ranking-table__row'));
  const labels = () => rows().map((r) => r.querySelector('.kc-ranking-table__label')?.textContent);
  const ranks = () => rows().map((r) => r.querySelector('.kc-ranking-table__rank')?.textContent);
  const cellTexts = (row: HTMLTableRowElement) =>
    Array.from(row.querySelectorAll('.kc-ranking-table__text')).map((c) => c.textContent);

  it('renders the entity header plus one aligned header per column', () => {
    mount({ label: 'Ranking de eficiencia', caption: '' });
    expect(root().className).toBe('kc-chart kc-ranking-table');
    const table = element.querySelector('table.kc-ranking-table__table')!;
    expect(table.getAttribute('aria-label')).toBe('Ranking de eficiencia');
    expect(table.querySelector('caption')).toBeNull();

    expect(headers().map((th) => th.textContent)).toEqual([
      'Estado / Unidad',
      'Trámites',
      'Tiempo medio',
      'Jornadas',
    ]);
    expect(headers().map((th) => th.getAttribute('scope'))).toEqual(['col', 'col', 'col', 'col']);
    expect(headers()[0].className).toBe('kc-align--left');
    expect(headers()[1].className).toBe('kc-align--right kc-ranking-table__sortable');
    expect(
      headers()[1].querySelector('button.kc-ranking-table__sort-btn')?.getAttribute('type'),
    ).toBe('button');
    expect(headers()[1].getAttribute('aria-sort')).toBe('none');
    expect(headers()[1].querySelector('.kc-ranking-table__sort')).toBeNull();
  });

  it('shows the caption, a text column without sort button and a custom entity header', () => {
    mount({
      caption: 'Eficiencia por unidad',
      label: 'ignored when there is a caption',
      entityHeader: 'Unidad',
      columns: [...COLUMNS, { key: 'note', header: 'Nota', type: 'text' }],
      rows: [{ ...ROWS[0], values: { ...ROWS[0].values, note: 'Turno doble' } }],
    });
    const table = element.querySelector('table')!;
    expect(table.querySelector('caption')?.textContent).toBe('Eficiencia por unidad');
    expect(table.hasAttribute('aria-label')).toBe(false);
    expect(headers()[0].textContent).toBe('Unidad');
    const note = headers()[4];
    expect(note.className).toBe('kc-align--left');
    expect(note.querySelector('button')).toBeNull();
    expect(note.hasAttribute('aria-sort')).toBe(false);
    const cells = Array.from(rows()[0].querySelectorAll('td'));
    expect(cells[4].className).toBe('kc-align--left');
    expect(cells[4].textContent).toBe('Turno doble');
  });

  it('keeps the input order by default, numbers the ranks and fills the first badge', () => {
    mount();
    expect(labels()).toEqual(['Zulia', 'Lara', 'Carabobo', 'Miranda', 'Dtto. Capital']);
    expect(ranks()).toEqual(['1', '2', '3', '4', '5']);
    expect(rows()[0].classList.contains('kc-ranking-table__row--first')).toBe(true);
    expect(
      rows()
        .slice(1)
        .some((r) => r.classList.contains('kc-ranking-table__row--first')),
    ).toBe(false);
    expect(rows()[0].querySelector('.kc-ranking-table__rank')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(rows()[0].querySelector('.kc-ranking-table__sublabel')?.textContent).toBe('UM-ZUL-02');
    expect(rows()[0].getAttribute('tabindex')).toBe('0');
    expect(rows()[0].dataset.id).toBe('VE-V');
    expect(rows()[0].getAttribute('aria-label')).toBe(
      '1. Zulia: procedures 4.620, avg 18 min, days 14',
    );
    expect(rows()[0].style.getPropertyValue('--kc-row-color')).toBe('var(--kc-color-1, #2563eb)');
  });

  it('sorts by a column, marks the header and emits the next sort on header clicks', () => {
    const changes: SortChangeEvent[] = [];
    const { rerender } = mount({ sortBy: 'procedures', onSortChange: (e) => changes.push(e) });
    expect(labels()).toEqual(['Zulia', 'Carabobo', 'Miranda', 'Lara', 'Dtto. Capital']);
    expect(ranks()).toEqual(['1', '2', '3', '4', '5']);
    expect(headers()[1].getAttribute('aria-sort')).toBe('descending');
    expect(headers()[1].querySelector('.kc-ranking-table__sort')?.textContent).toBe('▾');
    expect(headers()[1].querySelector('.kc-ranking-table__sort')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(headers()[2].getAttribute('aria-sort')).toBe('none');

    fireEvent.click(headers()[1].querySelector('button')!);
    expect(changes[0]).toEqual({ key: 'procedures', direction: 'asc' });
    fireEvent.click(headers()[2].querySelector('button')!);
    expect(changes[1]).toEqual({ key: 'avg', direction: 'desc' });
    // Controlled: nothing changes until the host updates the props.
    expect(labels()[0]).toBe('Zulia');

    rerender(
      <RankingTable
        rows={ROWS}
        columns={COLUMNS}
        sortBy="procedures"
        sortDirection="asc"
        onSortChange={(e) => changes.push(e)}
      />,
    );
    expect(labels()).toEqual(['Dtto. Capital', 'Lara', 'Miranda', 'Carabobo', 'Zulia']);
    expect(headers()[1].getAttribute('aria-sort')).toBe('ascending');
    expect(headers()[1].querySelector('.kc-ranking-table__sort')?.textContent).toBe('▴');
    fireEvent.click(headers()[1].querySelector('button')!);
    expect(changes[2]).toEqual({ key: 'procedures', direction: 'desc' });
  });

  it('formats the cells with es-VE, the column format and a dash for null', () => {
    mount({ rows: [ROWS[0], { id: 'X', label: 'Sin datos', values: { procedures: null } }] });
    expect(cellTexts(rows()[0])).toEqual(['4.620', '18 min', '14']);
    expect(cellTexts(rows()[1])).toEqual(['—', '—', '—']);
    const cells = Array.from(rows()[0].querySelectorAll('td'));
    expect(cells.map((td) => td.className)).toEqual([
      'kc-align--left',
      'kc-align--right',
      'kc-align--right',
      'kc-align--right',
    ]);
  });

  it('draws the bar only on bar columns, relative to the maximum', () => {
    mount({ sortBy: 'procedures' });
    const bars = (row: HTMLTableRowElement) =>
      Array.from(row.querySelectorAll('td')).map(
        (td) => td.querySelector<HTMLElement>('.kc-ranking-table__bar')?.style.width ?? null,
      );
    expect(bars(rows()[0])).toEqual([null, '100%', null, null]);
    expect(bars(rows()[1])).toEqual([null, '94.26%', null, null]);
    expect(element.querySelectorAll('.kc-ranking-table__bar')).toHaveLength(5);
    expect(element.querySelectorAll('.kc-ranking-table__value')).toHaveLength(15);
  });

  it('keeps only the first N rows with limit', () => {
    mount({ limit: 3, sortBy: 'procedures' });
    expect(rows()).toHaveLength(3);
    expect(labels()).toEqual(['Zulia', 'Carabobo', 'Miranda']);
    expect(ranks()).toEqual(['1', '2', '3']);
  });

  it('emits the original row and its index on click and Enter, only with a handler', () => {
    const events: [TableRow, number][] = [];
    const { rerender } = mount({
      sortBy: 'procedures',
      onRowClick: (row, index) => events.push([row, index]),
    });
    const row = rows()[1]; // Carabobo after sorting: ROWS[2]
    expect(row.classList.contains('kc-ranking-table__row--clickable')).toBe(true);
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(events).toHaveLength(3);
    expect(events[0][0]).toBe(ROWS[2]);
    expect(events[0][1]).toBe(2);

    rerender(<RankingTable rows={ROWS} columns={COLUMNS} sortBy="procedures" />);
    expect(rows()[1].classList.contains('kc-ranking-table__row--clickable')).toBe(false);
    expect(rows()[1].getAttribute('tabindex')).toBe('0');
    fireEvent.click(rows()[1]);
    expect(events).toHaveLength(3);
  });

  it('marks the active row and hides the rank badges on demand', () => {
    const { rerender } = mount({ activeId: 'VE-G' });
    expect(rows().map((r) => r.classList.contains('kc-ranking-table__row--active'))).toEqual([
      false,
      false,
      true,
      false,
      false,
    ]);
    expect(element.querySelectorAll('.kc-ranking-table__rank')).toHaveLength(5);

    rerender(<RankingTable rows={ROWS} columns={COLUMNS} showRank={false} />);
    expect(element.querySelector('.kc-ranking-table__rank')).toBeNull();
    expect(element.querySelector('.kc-ranking-table__row--active')).toBeNull();
  });

  it('shows the empty and loading states', () => {
    const { rerender } = mount({ rows: [] });
    expect(root().className).toBe('kc-chart kc-ranking-table');
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
    expect(element.querySelector('.kc-state--empty')?.getAttribute('style')).toContain('120px');
    expect(element.querySelector('table')).toBeNull();

    rerender(<RankingTable rows={[]} columns={COLUMNS} emptyText="Aún sin unidades" />);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Aún sin unidades');

    rerender(<RankingTable rows={ROWS} columns={COLUMNS} loading />);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('.kc-state--loading')?.getAttribute('style')).toContain('260px');
    expect(element.querySelector('table')).toBeNull();

    rerender(<RankingTable rows={[]} columns={COLUMNS} loading />);
    expect(element.querySelector('.kc-state--loading')?.getAttribute('style')).toContain('200px');

    rerender(<RankingTable rows={ROWS} columns={COLUMNS} className="extra" />);
    expect(root().className).toBe('kc-chart kc-ranking-table extra');
    expect(rows()).toHaveLength(5);
  });
});
