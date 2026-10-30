import { fireEvent, render } from '@testing-library/react';
import type { ChartPointEvent, ChartSeries } from 'kai-charts-core';
import { BarChart, type BarChartProps } from './bar-chart';
import { KaiChartsProvider } from './config';

const CATEGORIES = ['Nacimiento', 'Matrimonio', 'Defunción'];
const SERIES: ChartSeries[] = [
  { name: 'Registrados', data: [10000, 20000, 30000] },
  { name: 'Sincronizados', data: [5000, 15000, 25000] },
];

describe('BarChart', () => {
  let element: HTMLElement;

  function mount(props: Partial<BarChartProps> = {}) {
    const result = render(<BarChart categories={CATEGORIES} series={SERIES} {...props} />);
    element = result.container;
    return result;
  }

  const bars = () => Array.from(element.querySelectorAll<SVGRectElement>('rect.kc-bar'));
  const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

  it('renders one bar per category and series', () => {
    mount();
    expect(bars()).toHaveLength(6);
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('group');
    expect(element.firstElementChild?.className).toBe('kc-chart kc-bar-chart');
  });

  it('scales vertical bars by value and keeps a fixed height', () => {
    mount({ height: 320 });
    const [small, , big] = bars().filter((b) => b.dataset['series'] === '0');
    expect(num(big, 'height') / num(small, 'height')).toBeCloseTo(3, 2);
    expect(element.querySelector('svg')?.getAttribute('height')).toBe('320');
  });

  it('uses widths when horizontal', () => {
    mount({ orientation: 'horizontal' });
    const [small, , big] = bars().filter((b) => b.dataset['series'] === '0');
    expect(num(small, 'height')).toBe(num(big, 'height'));
    expect(num(big, 'width') / num(small, 'width')).toBeCloseTo(3, 2);
  });

  it('stacks series when stacked is set', () => {
    mount({ stacked: true });
    const [first, second] = bars().filter((b) => b.dataset['category'] === '0');
    expect(num(first, 'x')).toBe(num(second, 'x'));
    expect(num(second, 'y') + num(second, 'height')).toBeCloseTo(num(first, 'y'), 1);
  });

  it('formats axis ticks with es-VE by default', () => {
    mount();
    const ticks = Array.from(element.querySelectorAll('text.kc-tick')).map((t) =>
      t.textContent?.trim(),
    );
    expect(ticks).toContain('10.000');
  });

  it('accepts Intl options and custom formatters', () => {
    mount({ valueFormat: (v: number) => `${v / 1000}k`, showValues: true });
    const values = Array.from(element.querySelectorAll('text.kc-value')).map((t) =>
      t.textContent?.trim(),
    );
    expect(values).toContain('30k');
  });

  it('shows the empty state when every value is null', () => {
    mount({ series: [{ name: 'Nada', data: [null, null, null] }] });
    expect(bars()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
  });

  it('treats zeros as data and keeps the real axis', () => {
    mount({ series: [{ name: 'Trámites', data: [0, 0, 0] }] });
    expect(element.querySelector('.kc-state--empty')).toBeNull();
    expect(element.querySelectorAll('text.kc-tick')).toHaveLength(2 + CATEGORIES.length);
  });

  it('shows the loading skeleton instead of the chart', () => {
    mount({ loading: true });
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
  });

  it('renders the mirror table on demand', () => {
    mount({ showTable: true, label: 'Trámites' });
    expect(element.querySelector('caption')?.textContent?.trim()).toBe('Trámites');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.querySelector('tbody td')?.textContent?.trim()).toBe('10.000');
  });

  it('shows the legend only for several series by default and toggles them', () => {
    const { rerender } = mount();
    const buttons = element.querySelectorAll<HTMLButtonElement>('.kc-legend__item');
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(bars()).toHaveLength(3);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');

    rerender(<BarChart categories={CATEGORIES} series={[SERIES[0]]} />);
    expect(element.querySelector('.kc-legend')).toBeNull();
  });

  it('calls onBarClick with the data point on click and keyboard', () => {
    const events: ChartPointEvent[] = [];
    mount({ onBarClick: (e) => events.push(e) });
    const bar = bars()[1];
    fireEvent.click(bar);
    fireEvent.keyDown(bar, { key: 'Enter' });
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      seriesIndex: 1,
      categoryIndex: 0,
      series: 'Sincronizados',
      category: 'Nacimiento',
      value: 5000,
    });
  });

  it('opens an accessible tooltip on focus and closes it on blur', () => {
    mount();
    const bar = bars()[0];
    expect(bar.getAttribute('aria-label')).toBe('Nacimiento, Registrados: 10.000');
    fireEvent.focus(bar);
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.textContent).toContain('Nacimiento');
    expect(tooltip?.querySelectorAll('.kc-tooltip__row')).toHaveLength(2);
    fireEvent.blur(bar);
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('hides the value axis and moves the bars left with showValueAxis=false', () => {
    const { rerender } = mount();
    const withAxisX = num(bars()[0], 'x');
    expect(element.querySelectorAll('text.kc-tick').length).toBeGreaterThan(CATEGORIES.length);

    rerender(<BarChart categories={CATEGORIES} series={SERIES} showValueAxis={false} />);
    expect(element.querySelectorAll('text.kc-tick')).toHaveLength(CATEGORIES.length);
    expect(num(bars()[0], 'x')).toBeLessThan(withAxisX);
  });

  it('takes locale and texts from KaiChartsProvider', () => {
    const { container } = render(
      <KaiChartsProvider config={{ locale: 'en-US', emptyText: 'No data' }}>
        <BarChart categories={CATEGORIES} series={SERIES} />
        <BarChart categories={CATEGORIES} series={[{ name: 'Nada', data: [null] }]} />
      </KaiChartsProvider>,
    );
    const ticks = Array.from(container.querySelectorAll('text.kc-tick')).map((t) =>
      t.textContent?.trim(),
    );
    expect(ticks).toContain('10,000');
    expect(container.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('No data');
  });
});
