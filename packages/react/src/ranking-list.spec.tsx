import { fireEvent, render, screen } from '@testing-library/react';
import type { RankingItem } from 'kai-charts-core';
import { RankingList, type RankingListProps } from './ranking-list';

const CITIZENS_BY_STATE: RankingItem[] = [
  { id: 'VE-V', label: 'Zulia', value: 5260 },
  { id: 'VE-M', label: 'Miranda', value: 4940 },
  { id: 'VE-A', label: 'Distrito Capital', value: 3830 },
  { id: 'VE-G', label: 'Carabobo', value: 3540 },
  { id: 'VE-K', label: 'Lara', value: 3390 },
  { id: 'VE-B', label: 'Anzoátegui', value: 2980 },
  { id: 'VE-F', label: 'Bolívar', value: 2340 },
];

/** Same data, deliberately out of order, to exercise the sorting. */
const SHUFFLED: RankingItem[] = [
  CITIZENS_BY_STATE[4],
  CITIZENS_BY_STATE[0],
  CITIZENS_BY_STATE[6],
  CITIZENS_BY_STATE[1],
];

describe('RankingList', () => {
  let element: HTMLElement;

  function mount(props: Partial<RankingListProps> = {}) {
    const result = render(<RankingList items={CITIZENS_BY_STATE} {...props} />);
    element = result.container;
    return result;
  }

  const rows = () => Array.from(element.querySelectorAll<HTMLLIElement>('li.kc-ranking__item'));
  const labels = () =>
    rows().map((r) => r.querySelector('.kc-ranking__label')?.textContent?.trim());
  const ranks = () => rows().map((r) => r.querySelector('.kc-ranking__rank')?.textContent?.trim());

  it('sorts descending by default, numbers the ranks and keeps the order with sort="none"', () => {
    const { rerender } = mount({ items: SHUFFLED, label: 'Ciudadanos por estado' });
    const list = element.firstElementChild as HTMLElement;
    expect(list.tagName).toBe('OL');
    expect(list.className).toBe('kc-chart kc-ranking');
    expect(list.getAttribute('aria-label')).toBe('Ciudadanos por estado');
    expect(labels()).toEqual(['Zulia', 'Miranda', 'Lara', 'Bolívar']);
    expect(ranks()).toEqual(['1', '2', '3', '4']);
    expect(rows()[0].getAttribute('aria-label')).toBe('1. Zulia: 5.260');

    rerender(<RankingList items={SHUFFLED} sort="none" />);
    expect(labels()).toEqual(['Lara', 'Zulia', 'Bolívar', 'Miranda']);
    expect(ranks()).toEqual(['1', '2', '3', '4']);
  });

  it('keeps only the top N with limit', () => {
    mount({ limit: 5 });
    expect(rows()).toHaveLength(5);
    expect(labels()).toEqual(['Zulia', 'Miranda', 'Distrito Capital', 'Carabobo', 'Lara']);
  });

  it('sizes the bars relative to the first row', () => {
    mount();
    const widths = rows().map(
      (r) => r.querySelector<HTMLDivElement>('.kc-ranking__bar')?.style.width,
    );
    expect(widths[0]).toBe('100%');
    expect(widths[1]).toBe('93.92%');
    expect(rows()[0].style.getPropertyValue('--kc-row-color')).toBe('var(--kc-color-1, #2563eb)');
  });

  it('marks only the first row', () => {
    mount();
    expect(rows()[0].classList.contains('kc-ranking__item--first')).toBe(true);
    expect(
      rows()
        .slice(1)
        .some((r) => r.classList.contains('kc-ranking__item--first')),
    ).toBe(false);
  });

  it('formats the value with es-VE and renders the sublabel when present', () => {
    mount({ items: [{ ...CITIZENS_BY_STATE[0], sublabel: 'UM-ZUL-02' }, CITIZENS_BY_STATE[1]] });
    expect(rows()[0].querySelector('.kc-ranking__value')?.textContent?.trim()).toBe('5.260');
    expect(rows()[0].querySelector('.kc-ranking__sublabel')?.textContent?.trim()).toBe('UM-ZUL-02');
    expect(rows()[1].querySelector('.kc-ranking__sublabel')).toBeNull();
    expect(screen.getByText('4.940')).not.toBeNull();
  });

  it('hides bars and ranks on demand', () => {
    const { rerender } = mount({ showBars: false });
    expect(element.querySelector('.kc-ranking__track')).toBeNull();
    expect(element.querySelectorAll('.kc-ranking__rank')).toHaveLength(7);

    rerender(<RankingList items={CITIZENS_BY_STATE} showRank={false} />);
    expect(element.querySelector('.kc-ranking__rank')).toBeNull();
    expect(element.querySelectorAll('.kc-ranking__track')).toHaveLength(7);
  });

  it('emits the original item and its index in items on click and Enter', () => {
    const events: [RankingItem, number][] = [];
    const { rerender } = mount({
      items: SHUFFLED,
      onItemClick: (item, index) => events.push([item, index]),
    });
    const row = rows()[1]; // Miranda after sorting: SHUFFLED[3]
    expect(row.classList.contains('kc-ranking__item--clickable')).toBe(true);
    expect(row.getAttribute('tabindex')).toBe('0');
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    expect(events).toHaveLength(3);
    expect(events[0][0]).toBe(CITIZENS_BY_STATE[1]);
    expect(events[0][1]).toBe(3);

    rerender(<RankingList items={SHUFFLED} />);
    expect(rows()[1].classList.contains('kc-ranking__item--clickable')).toBe(false);
    expect(rows()[1].hasAttribute('tabindex')).toBe(false);
  });

  it('shows the empty and loading states', () => {
    const { rerender } = mount({ items: [] });
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
    expect(element.firstElementChild?.hasAttribute('role')).toBe(false);
    expect(rows()).toHaveLength(0);

    rerender(<RankingList items={CITIZENS_BY_STATE} loading />);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('.kc-state--loading')?.getAttribute('style')).toContain('364px');
    expect(rows()).toHaveLength(0);

    rerender(<RankingList items={CITIZENS_BY_STATE} />);
    expect(element.firstElementChild?.getAttribute('role')).toBe('list');
  });
});
