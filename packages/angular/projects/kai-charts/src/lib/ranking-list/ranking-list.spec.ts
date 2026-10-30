import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RankingItem } from 'kai-charts-core';
import { ItemClickEvent } from '../core/events';
import { KcRankingList } from './ranking-list';

const ITEMS: RankingItem[] = [
  { id: 'VE-A', label: 'Distrito Capital', value: 3830 },
  { id: 'VE-V', label: 'Zulia', sublabel: 'UM-ZUL-02', value: 5260 },
  { id: 'VE-M', label: 'Miranda', value: 4940 },
  { id: 'VE-G', label: 'Carabobo', value: 3540 },
  { id: 'VE-K', label: 'Lara', value: 3390 },
  { id: 'VE-B', label: 'Anzoátegui', value: 2980 },
  { id: 'VE-F', label: 'Bolívar', value: 2340 },
];

describe('KcRankingList', () => {
  let fixture: ComponentFixture<KcRankingList>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcRankingList] }).compileComponents();
    fixture = TestBed.createComponent(KcRankingList);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('items', ITEMS);
  });

  const rows = () => Array.from(element.querySelectorAll<HTMLLIElement>('li.kc-ranking__item'));
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector)).map((el) => el.textContent?.trim());

  it('sorts descending by default, numbers the ranks and honours sort="none"', () => {
    fixture.componentRef.setInput('label', 'Ciudadanos por estado');
    fixture.detectChanges();
    expect(element.getAttribute('role')).toBe('list');
    expect(element.getAttribute('aria-label')).toBe('Ciudadanos por estado');
    expect(texts('.kc-ranking__label')).toEqual([
      'Zulia',
      'Miranda',
      'Distrito Capital',
      'Carabobo',
      'Lara',
      'Anzoátegui',
      'Bolívar',
    ]);
    expect(texts('.kc-ranking__rank')).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(rows()[0].getAttribute('aria-label')).toBe('1. Zulia: 5.260');

    fixture.componentRef.setInput('sort', 'none');
    fixture.detectChanges();
    expect(texts('.kc-ranking__label').slice(0, 3)).toEqual([
      'Distrito Capital',
      'Zulia',
      'Miranda',
    ]);
  });

  it('keeps only the top N rows with limit', () => {
    fixture.componentRef.setInput('limit', 5);
    fixture.detectChanges();
    expect(rows()).toHaveLength(5);
    expect(texts('.kc-ranking__label')).not.toContain('Bolívar');
  });

  it('sizes the bars relative to the first row', () => {
    fixture.detectChanges();
    const widths = Array.from(element.querySelectorAll<HTMLElement>('.kc-ranking__bar')).map(
      (b) => b.style.width,
    );
    expect(widths[0]).toBe('100%');
    expect(widths[1]).toBe('93.92%');
  });

  it('marks only the first row', () => {
    fixture.detectChanges();
    const [first, ...rest] = rows();
    expect(first.classList.contains('kc-ranking__item--first')).toBe(true);
    expect(rest.some((row) => row.classList.contains('kc-ranking__item--first'))).toBe(false);
    expect(first.style.getPropertyValue('--kc-row-color')).toBe('var(--kc-color-1, #2563eb)');
  });

  it('formats values with es-VE and renders the sublabel when present', () => {
    fixture.detectChanges();
    expect(texts('.kc-ranking__value')[0]).toBe('5.260');
    expect(texts('.kc-ranking__sublabel')).toEqual(['UM-ZUL-02']);
    expect(rows()[1].querySelector('.kc-ranking__sublabel')).toBeNull();
  });

  it('hides bars and ranks on demand', () => {
    fixture.componentRef.setInput('showBars', false);
    fixture.componentRef.setInput('showRank', false);
    fixture.detectChanges();
    expect(element.querySelector('.kc-ranking__track')).toBeNull();
    expect(element.querySelector('.kc-ranking__rank')).toBeNull();
    expect(rows()).toHaveLength(7);
  });

  it('emits itemClick with the original item and its index on click and keyboard', () => {
    fixture.componentRef.setInput('limit', 5);
    fixture.detectChanges();
    const events: ItemClickEvent<RankingItem>[] = [];
    fixture.componentInstance.itemClick.subscribe((e) => events.push(e));
    const second = rows()[1];
    expect(second.getAttribute('tabindex')).toBe('0');
    expect(second.classList.contains('kc-ranking__item--clickable')).toBe(true);
    second.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ item: ITEMS[2], index: 2 });
    expect(events[0].item).toBe(ITEMS[2]);
  });

  it('shows the empty and loading states instead of the rows', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(rows()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
    expect(element.getAttribute('role')).toBeNull();

    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(rows()).toHaveLength(0);
    const skeleton = element.querySelector<HTMLElement>('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.style.height).toBe('364px');
  });
});
