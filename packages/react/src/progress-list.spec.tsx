import { fireEvent, render, screen } from '@testing-library/react';
import type { ProgressItem } from 'kai-charts-core';
import { ProgressList, type ProgressListProps } from './progress-list';

const DENSITY: ProgressItem[] = [
  { label: 'Amazonas', value: 1.7, tone: 'danger', caption: 'Desatendida · 280 trámites' },
  { label: 'Bolívar', value: 4.1, tone: 'warning', caption: 'Cobertura baja · 2.340 trámites' },
  {
    label: 'Miranda',
    value: 21.3,
    tone: 'success',
    caption: 'Cobertura adecuada · 6.840 trámites',
  },
];

describe('ProgressList', () => {
  let element: HTMLElement;

  function mount(props: Partial<ProgressListProps> = {}) {
    const result = render(<ProgressList items={DENSITY} {...props} />);
    element = result.container;
    return result;
  }

  const rows = () => Array.from(element.querySelectorAll<HTMLLIElement>('li.kc-progress__item'));
  const bars = () => Array.from(element.querySelectorAll<HTMLDivElement>('.kc-progress__bar'));

  it('renders one row per item with label, value and caption', () => {
    mount({ label: 'Densidad de atención' });
    const list = element.firstElementChild as HTMLElement;
    expect(list.tagName).toBe('UL');
    expect(list.className).toBe('kc-chart kc-progress');
    expect(list.getAttribute('role')).toBe('list');
    expect(list.getAttribute('aria-label')).toBe('Densidad de atención');
    expect(rows()).toHaveLength(3);
    const first = rows()[0];
    expect(first.querySelector('.kc-progress__label')?.textContent?.trim()).toBe('Amazonas');
    expect(first.querySelector('.kc-progress__value')?.textContent?.trim()).toBe('1,7');
    expect(first.querySelector('.kc-progress__caption')?.textContent?.trim()).toBe(
      'Desatendida · 280 trámites',
    );
    expect(first.getAttribute('aria-label')).toBe('Amazonas: 1,7');
    expect(screen.getByText('Miranda')).not.toBeNull();
  });

  it('sizes the bars relative to the largest value and respects max', () => {
    const { rerender } = mount();
    expect(bars().map((b) => b.style.width)).toEqual(['7.98%', '19.25%', '100%']);

    rerender(<ProgressList items={DENSITY} max={42.6} />);
    expect(bars()[2].style.width).toBe('50%');
    expect(rows()[2].querySelector('[role="progressbar"]')?.getAttribute('aria-valuemax')).toBe(
      '42.6',
    );
  });

  it('applies the tone class and row color from the core, custom color wins', () => {
    mount({ items: [...DENSITY, { label: 'Zulia', value: 9, tone: 'danger', color: '#123456' }] });
    const [amazonas, , , zulia] = rows();
    expect(amazonas.classList.contains('kc-tone--danger')).toBe(true);
    expect(amazonas.getAttribute('style')).toContain('--kc-row-color');
    expect(amazonas.style.getPropertyValue('--kc-row-color')).toBe('var(--kc-danger, #dc2626)');
    expect(zulia.style.getPropertyValue('--kc-row-color')).toBe('#123456');
  });

  it('exposes each bar as an accessible progressbar', () => {
    mount();
    const track = rows()[0].querySelector('.kc-progress__track');
    expect(track?.getAttribute('role')).toBe('progressbar');
    expect(track?.getAttribute('aria-valuemin')).toBe('0');
    expect(track?.getAttribute('aria-valuemax')).toBe('21.3');
    expect(track?.getAttribute('aria-valuenow')).toBe('1.7');
    expect(track?.getAttribute('aria-label')).toBe('Amazonas: 1,7');
  });

  it('hides the values with showValues=false', () => {
    mount({ showValues: false });
    expect(element.querySelector('.kc-progress__value')).toBeNull();
    expect(element.querySelectorAll('.kc-progress__label')).toHaveLength(3);
  });

  it('shows the empty and loading states', () => {
    const { rerender } = mount({ items: [] });
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
    expect(element.firstElementChild?.hasAttribute('role')).toBe(false);
    expect(rows()).toHaveLength(0);

    rerender(<ProgressList items={DENSITY} loading />);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('.kc-state--loading')?.getAttribute('style')).toContain('168px');
    expect(rows()).toHaveLength(0);
  });

  it('emits the item and index on click and Enter, only when a handler is given', () => {
    const events: [ProgressItem, number][] = [];
    const { rerender } = mount({ onItemClick: (item, index) => events.push([item, index]) });
    const row = rows()[1];
    expect(row.classList.contains('kc-progress__item--clickable')).toBe(true);
    expect(row.getAttribute('tabindex')).toBe('0');
    fireEvent.click(row);
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    fireEvent.keyDown(row, { key: 'a' });
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual([DENSITY[1], 1]);

    rerender(<ProgressList items={DENSITY} />);
    expect(rows()[1].classList.contains('kc-progress__item--clickable')).toBe(false);
    expect(rows()[1].hasAttribute('tabindex')).toBe(false);
  });
});
