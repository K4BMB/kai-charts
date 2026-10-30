import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableColumn, TableRow } from 'kai-charts-core';
import { ItemClickEvent } from '../core/events';
import { KcRankingTable, SortChangeEvent } from './ranking-table';

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
    values: { procedures: 3980, avg: 27, days: null },
  },
];

describe('KcRankingTable', () => {
  let fixture: ComponentFixture<KcRankingTable>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcRankingTable] }).compileComponents();
    fixture = TestBed.createComponent(KcRankingTable);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('columns', COLUMNS);
  });

  const rows = () =>
    Array.from(element.querySelectorAll<HTMLTableRowElement>('tr.kc-ranking-table__row'));
  const headers = () => Array.from(element.querySelectorAll<HTMLTableCellElement>('thead th'));
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector)).map((el) => el.textContent?.trim());
  const cellTexts = (row: Element) =>
    Array.from(row.querySelectorAll('.kc-ranking-table__text')).map((c) => c.textContent?.trim());

  it('renders the entity header plus one aligned header per column', () => {
    fixture.componentRef.setInput('label', 'Ranking por unidad');
    fixture.componentRef.setInput('columns', [
      ...COLUMNS,
      { key: 'zone', header: 'Zona', type: 'text' },
    ]);
    fixture.detectChanges();
    expect(element.classList.contains('kc-ranking-table')).toBe(true);
    const table = element.querySelector('table.kc-ranking-table__table')!;
    expect(table.getAttribute('aria-label')).toBe('Ranking por unidad');
    expect(table.querySelector('caption')).toBeNull();
    expect(texts('thead th')).toEqual([
      'Estado / Unidad',
      'Trámites',
      'Tiempo medio',
      'Jornadas',
      'Zona',
    ]);
    const [entity, procedures, avg, days, zone] = headers();
    expect(entity.classList.contains('kc-align--left')).toBe(true);
    expect(entity.getAttribute('scope')).toBe('col');
    expect(entity.hasAttribute('aria-sort')).toBe(false);
    for (const th of [procedures, avg, days]) {
      expect(th.classList.contains('kc-align--right')).toBe(true);
      expect(th.classList.contains('kc-ranking-table__sortable')).toBe(true);
      expect(th.querySelector('button.kc-ranking-table__sort-btn')?.getAttribute('type')).toBe(
        'button',
      );
      expect(th.getAttribute('aria-sort')).toBe('none');
    }
    expect(zone.classList.contains('kc-align--left')).toBe(true);
    expect(zone.classList.contains('kc-ranking-table__sortable')).toBe(false);
    expect(zone.querySelector('button')).toBeNull();
    expect(zone.hasAttribute('aria-sort')).toBe(false);
    expect(element.querySelectorAll('.kc-ranking-table__sort')).toHaveLength(0);

    fixture.componentRef.setInput('entityHeader', 'Unidad móvil');
    fixture.componentRef.setInput('caption', 'Ranking de eficiencia');
    fixture.detectChanges();
    expect(headers()[0].textContent?.trim()).toBe('Unidad móvil');
    expect(table.querySelector('caption')?.textContent?.trim()).toBe('Ranking de eficiencia');
    expect(table.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps the input order by default, numbers the ranks and fills the first badge', () => {
    fixture.detectChanges();
    expect(texts('.kc-ranking-table__label')).toEqual([
      'Zulia',
      'Lara',
      'Carabobo',
      'Miranda',
      'Dtto. Capital',
    ]);
    expect(texts('.kc-ranking-table__sublabel')).toEqual([
      'UM-ZUL-02',
      'UM-LAR-04',
      'UM-CAR-04',
      'UM-MIR-04',
      'UM-DC-04',
    ]);
    expect(texts('.kc-ranking-table__rank')).toEqual(['1', '2', '3', '4', '5']);
    const [first, ...rest] = rows();
    expect(first.classList.contains('kc-ranking-table__row--first')).toBe(true);
    expect(rest.some((r) => r.classList.contains('kc-ranking-table__row--first'))).toBe(false);
    expect(first.getAttribute('data-id')).toBe('VE-V');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-label')).toBe(
      '1. Zulia: procedures 4.620, avg 18 min, days 14',
    );
    expect(first.style.getPropertyValue('--kc-row-color')).toBe('var(--kc-color-1, #2563eb)');
    expect(first.querySelector('.kc-ranking-table__rank')?.getAttribute('aria-hidden')).toBe(
      'true',
    );

    fixture.componentRef.setInput('showRank', false);
    fixture.detectChanges();
    expect(element.querySelectorAll('.kc-ranking-table__rank')).toHaveLength(0);
  });

  it('sorts by the controlled column, exposes aria-sort and emits sortChange from the headers', () => {
    fixture.componentRef.setInput('sortBy', 'procedures');
    fixture.detectChanges();
    expect(texts('.kc-ranking-table__label')).toEqual([
      'Zulia',
      'Carabobo',
      'Miranda',
      'Lara',
      'Dtto. Capital',
    ]);
    expect(texts('.kc-ranking-table__rank')).toEqual(['1', '2', '3', '4', '5']);
    const [, procedures, avg] = headers();
    expect(procedures.getAttribute('aria-sort')).toBe('descending');
    expect(avg.getAttribute('aria-sort')).toBe('none');
    expect(procedures.querySelector('.kc-ranking-table__sort')?.textContent).toBe('▾');
    expect(procedures.querySelector('.kc-ranking-table__sort')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(procedures.querySelector('button')?.textContent?.trim()).toBe('Trámites▾');
    expect(avg.querySelector('.kc-ranking-table__sort')).toBeNull();

    const changes: SortChangeEvent[] = [];
    fixture.componentInstance.sortChange.subscribe((e) => changes.push(e));
    procedures.querySelector('button')!.click();
    avg.querySelector('button')!.click();
    expect(changes).toEqual([
      { key: 'procedures', direction: 'asc' },
      { key: 'avg', direction: 'desc' },
    ]);
    // Controlled: the table itself did not re-sort.
    expect(texts('.kc-ranking-table__label')[0]).toBe('Zulia');

    fixture.componentRef.setInput('sortDirection', 'asc');
    fixture.detectChanges();
    expect(texts('.kc-ranking-table__label')).toEqual([
      'Dtto. Capital',
      'Lara',
      'Miranda',
      'Carabobo',
      'Zulia',
    ]);
    expect(procedures.getAttribute('aria-sort')).toBe('ascending');
    expect(procedures.querySelector('.kc-ranking-table__sort')?.textContent).toBe('▴');
    procedures.querySelector('button')!.click();
    expect(changes[2]).toEqual({ key: 'procedures', direction: 'desc' });
  });

  it('formats the cells with es-VE, the column format or a dash for null', () => {
    fixture.detectChanges();
    expect(cellTexts(rows()[0])).toEqual(['4.620', '18 min', '14']);
    expect(cellTexts(rows()[4])).toEqual(['3.980', '27 min', '—']);
    const cells = Array.from(rows()[0].querySelectorAll('td'));
    expect(cells[0].classList.contains('kc-align--left')).toBe(true);
    expect(cells.slice(1).every((td) => td.classList.contains('kc-align--right'))).toBe(true);
    expect(
      cells[1].querySelector('.kc-ranking-table__value .kc-ranking-table__text'),
    ).not.toBeNull();
  });

  it('draws the bar only on bar columns, relative to the column maximum', () => {
    fixture.detectChanges();
    const bars = (row: Element) =>
      Array.from(row.querySelectorAll<HTMLElement>('.kc-ranking-table__bar')).map(
        (b) => b.style.width,
      );
    expect(bars(rows()[0])).toEqual(['100%']);
    expect(bars(rows()[1])).toEqual(['86.99%']);
    expect(rows()[0].querySelectorAll('td')[2].querySelector('.kc-ranking-table__bar')).toBeNull();
    expect(element.querySelectorAll('.kc-ranking-table__bar')).toHaveLength(5);
  });

  it('keeps only the top N rows with limit', () => {
    fixture.componentRef.setInput('limit', 3);
    fixture.componentRef.setInput('sortBy', 'procedures');
    fixture.detectChanges();
    expect(rows()).toHaveLength(3);
    expect(texts('.kc-ranking-table__label')).toEqual(['Zulia', 'Carabobo', 'Miranda']);
  });

  it('emits rowClick with the original row and its index on click and keyboard', () => {
    fixture.componentRef.setInput('sortBy', 'procedures');
    fixture.detectChanges();
    const clicks: ItemClickEvent<TableRow>[] = [];
    fixture.componentInstance.rowClick.subscribe((e) => clicks.push(e));
    const second = rows()[1];
    expect(second.classList.contains('kc-ranking-table__row--clickable')).toBe(true);
    second.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    second.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clicks).toHaveLength(3);
    expect(clicks[0]).toEqual({ item: ROWS[2], index: 2 });
    expect(clicks[0].item).toBe(ROWS[2]);
  });

  it('marks the active row', () => {
    fixture.componentRef.setInput('activeId', 'VE-G');
    fixture.detectChanges();
    const active = element.querySelectorAll('.kc-ranking-table__row--active');
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('data-id')).toBe('VE-G');
  });

  it('shows the empty and loading states instead of the table', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
    expect(element.querySelector('table')).toBeNull();
    const empty = element.querySelector<HTMLElement>('.kc-state--empty');
    expect(empty?.textContent?.trim()).toBe('Sin datos');
    expect(empty?.style.height).toBe('120px');

    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(element.querySelector('table')).toBeNull();
    const skeleton = element.querySelector<HTMLElement>('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.style.height).toBe('260px');

    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();
    expect(element.querySelector<HTMLElement>('[aria-busy="true"]')?.style.height).toBe('200px');
  });
});
