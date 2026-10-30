import { fireEvent, render } from '@testing-library/react';
import type { ChartPointEvent, ChartSeries } from 'kai-charts-core';
import { LineChart, type LineChartProps } from './line-chart';

const CATEGORIES = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
const SERIES: ChartSeries[] = [
  { name: 'Jornadas ejecutadas', data: [20, 22, 26, 24, 28, 31] },
  { name: 'Saldo fiscal', data: [48, 45, 43, 40, 38, 36] },
];
const THOUSANDS: ChartSeries[] = [
  { name: 'Actas', data: [10000, 22000, 26000, 24000, 28000, 31000] },
];

describe('LineChart', () => {
  let element: HTMLElement;

  function mount(props: Partial<LineChartProps> = {}) {
    const result = render(<LineChart categories={CATEGORIES} series={SERIES} {...props} />);
    element = result.container;
    return result;
  }

  const points = () => Array.from(element.querySelectorAll<SVGCircleElement>('circle.kc-point'));
  const lines = () => Array.from(element.querySelectorAll<SVGPathElement>('path.kc-line'));
  // Category ticks carry a `<title>`; read only the visible text node.
  const ticks = () =>
    Array.from(element.querySelectorAll('text.kc-tick')).map((t) =>
      Array.from(t.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim(),
    );

  it('renders one point per finite value and one line per series', () => {
    mount({ label: 'Ciudadanos por jornada' });
    expect(element.firstElementChild?.className).toBe('kc-chart kc-line-chart');
    expect(points()).toHaveLength(12);
    expect(lines()).toHaveLength(2);
    expect(lines()[1].getAttribute('data-series')).toBe('1');
    expect(lines()[1].getAttribute('style')).toContain('stroke');
    const svg = element.querySelector('svg.kc-svg');
    expect(svg?.getAttribute('role')).toBe('group');
    expect(svg?.getAttribute('aria-label')).toBe('Ciudadanos por jornada');
    expect(svg?.getAttribute('height')).toBe('280');
    expect(points()[0].getAttribute('aria-label')).toBe('May, Jornadas ejecutadas: 20');
    expect(points()[0].getAttribute('r')).toBe('3');
    expect(element.querySelector('line.kc-axis')).not.toBeNull();
    expect(element.querySelectorAll('line.kc-grid').length).toBeGreaterThan(0);
  });

  it('splits the path at gaps', () => {
    mount({ series: [{ name: 'Con hueco', data: [10, 20, null, 30, 25, 40] }] });
    expect(points()).toHaveLength(5);
    const d = lines()[0].getAttribute('d') ?? '';
    expect(d.match(/M/g)).toHaveLength(2);
  });

  it('adds an area path per series before the lines when area is set', () => {
    const { rerender } = mount({ area: true });
    const areas = element.querySelectorAll('path.kc-area');
    expect(areas).toHaveLength(2);
    expect(areas[0].getAttribute('d')).toMatch(/Z$/);
    expect(areas[0].getAttribute('style')).toContain('fill');
    const allPaths = Array.from(element.querySelectorAll('svg path'));
    expect(allPaths.slice(0, 2).every((p) => p.classList.contains('kc-area'))).toBe(true);

    rerender(<LineChart categories={CATEGORIES} series={SERIES} />);
    expect(element.querySelector('path.kc-area')).toBeNull();
  });

  it('draws smooth curves by default and straight segments with curve="linear"', () => {
    const { rerender } = mount();
    expect(lines()[0].getAttribute('d')).toContain('C');

    rerender(<LineChart categories={CATEGORIES} series={SERIES} curve="linear" />);
    const d = lines()[0].getAttribute('d') ?? '';
    expect(d).not.toContain('C');
    expect(d).toContain('L');
  });

  it('formats value ticks with es-VE and hides them with showValueAxis=false', () => {
    const { rerender } = mount({ series: THOUSANDS });
    expect(ticks()).toContain('10.000');
    const firstPointX = Number(points()[0].getAttribute('cx'));

    rerender(<LineChart categories={CATEGORIES} series={THOUSANDS} showValueAxis={false} />);
    expect(ticks()).toEqual(CATEGORIES);
    expect(Number(points()[0].getAttribute('cx'))).toBeLessThan(firstPointX);

    rerender(<LineChart categories={CATEGORIES} series={THOUSANDS} showCategoryAxis={false} />);
    expect(ticks()).not.toContain('May');
  });

  it('prints the last value of each series with showEndValues', () => {
    mount({ showEndValues: true });
    const values = Array.from(element.querySelectorAll('text.kc-value')).map((t) =>
      t.textContent?.trim(),
    );
    expect(values).toEqual(['31', '36']);
  });

  it('shows the empty state for null data and the skeleton while loading', () => {
    const { rerender } = mount({ series: [{ name: 'Nada', data: [null, null] }] });
    expect(points()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');

    rerender(<LineChart categories={CATEGORIES} series={SERIES} loading />);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
    expect(element.querySelector('.kc-state--empty')).toBeNull();
  });

  it('shows the legend automatically for several series and toggles them', () => {
    const { rerender } = mount();
    const buttons = element.querySelectorAll<HTMLButtonElement>('.kc-legend__item');
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(lines()).toHaveLength(1);
    expect(points()).toHaveLength(6);
    expect(points().every((p) => p.dataset['series'] === '0')).toBe(true);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');

    rerender(<LineChart categories={CATEGORIES} series={[SERIES[0]]} />);
    expect(element.querySelector('.kc-legend')).toBeNull();
  });

  it('calls onPointClick with the data point on click and keyboard', () => {
    const events: ChartPointEvent[] = [];
    mount({ onPointClick: (e) => events.push(e) });
    const point = points()[7];
    fireEvent.click(point);
    fireEvent.keyDown(point, { key: 'Enter' });
    fireEvent.keyDown(point, { key: ' ' });
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({
      seriesIndex: 1,
      categoryIndex: 1,
      series: 'Saldo fiscal',
      category: 'Jun',
      value: 45,
    });
  });

  it('opens a tooltip with one row per series on focus and closes it on blur', () => {
    mount();
    const point = points()[2];
    fireEvent.focus(point);
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.querySelector('.kc-tooltip__title')?.textContent).toBe('Jul');
    const rows = tooltip?.querySelectorAll('.kc-tooltip__row') ?? [];
    expect(rows).toHaveLength(2);
    expect(rows[0].classList.contains('kc-tooltip__row--active')).toBe(true);
    expect(rows[0].querySelector('.kc-tooltip__value')?.textContent).toBe('26');
    expect(rows[1].querySelector('.kc-tooltip__value')?.textContent).toBe('43');
    fireEvent.blur(point);
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('renders the mirror table on demand', () => {
    mount({ showTable: true, label: 'Jornadas', categoryHeader: 'Mes' });
    expect(element.querySelector('caption')?.textContent?.trim()).toBe('Jornadas');
    expect(element.querySelector('thead th')?.textContent).toBe('Mes');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(6);
  });
});
