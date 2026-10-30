import { fireEvent, render } from '@testing-library/react';
import type { RingItem } from 'kai-charts-core';
import { RingChart, type RingChartProps } from './ring-chart';

const RINGS: RingItem[] = [
  { name: 'Saldo', value: 0.917 },
  { name: 'Emitidas', value: 0.942 },
  { name: 'Recibidas', value: 0.871 },
];

describe('RingChart', () => {
  let element: HTMLElement;

  function mount(props: Partial<RingChartProps> = {}) {
    const result = render(<RingChart items={RINGS} {...props} />);
    element = result.container;
    return result;
  }

  const tracks = () =>
    Array.from(element.querySelectorAll<SVGCircleElement>('circle.kc-ring__track'));
  const arcs = () => Array.from(element.querySelectorAll<SVGCircleElement>('circle.kc-ring__arc'));
  const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

  it('renders one track and one arc per ring, the outer one first', () => {
    mount({ label: 'Atención nacional' });
    expect(element.firstElementChild?.className).toBe('kc-chart kc-ring');
    expect(tracks()).toHaveLength(3);
    expect(arcs()).toHaveLength(3);
    expect(num(arcs()[0], 'r')).toBeGreaterThan(num(arcs()[1], 'r'));
    expect(num(arcs()[1], 'r')).toBeGreaterThan(num(arcs()[2], 'r'));
    expect(num(tracks()[0], 'r')).toBe(num(arcs()[0], 'r'));
    expect(arcs()[0].getAttribute('stroke-width')).toBe(tracks()[0].getAttribute('stroke-width'));
    expect(arcs()[0].getAttribute('transform')).toBe('rotate(-90 100 100)');
    expect(arcs()[0].getAttribute('aria-label')).toBe('Saldo: 91,7%');
    expect(arcs()[0].getAttribute('role')).toBe('img');
    expect(arcs()[0].getAttribute('tabindex')).toBe('0');
    const figure = element.querySelector<HTMLElement>('.kc-ring__figure');
    expect(figure?.style.maxWidth).toBe('200px');
    const svg = element.querySelector('svg.kc-ring__svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 200 200');
    expect(svg?.getAttribute('aria-label')).toBe('Atención nacional');
  });

  it('sets the dash array from the share and fills the circle at 100 % or more', () => {
    mount({
      items: [
        { name: 'Mitad', value: 0.5 },
        { name: 'Lleno', value: 1.2 },
      ],
    });
    const [half, full] = arcs();
    const [halfDash, halfCircumference] = (half.getAttribute('stroke-dasharray') ?? '')
      .split(' ')
      .map(Number);
    expect(halfCircumference).toBeCloseTo(2 * Math.PI * num(half, 'r'), 1);
    expect(halfDash).toBeCloseTo(halfCircumference / 2, 1);
    const [fullDash, fullCircumference] = (full.getAttribute('stroke-dasharray') ?? '')
      .split(' ')
      .map(Number);
    expect(fullDash).toBe(fullCircumference);
    expect(full.classList.contains('kc-ring__arc--empty')).toBe(false);
  });

  it('marks a zero ring as empty', () => {
    mount({
      items: [
        { name: 'Nada', value: 0 },
        { name: 'Algo', value: 0.3 },
      ],
    });
    expect(arcs()[0].classList.contains('kc-ring__arc--empty')).toBe(true);
    expect(arcs()[0].getAttribute('stroke-dasharray')).toMatch(/^0 /);
    expect(arcs()[1].classList.contains('kc-ring__arc--empty')).toBe(false);
  });

  it('renders the center label, value and trend only when given', () => {
    const { rerender } = mount({ centerLabel: 'Saldo', centerValue: 0.917, centerTrend: 0.038 });
    const center = element.querySelector('.kc-ring__center');
    expect(center?.querySelector('.kc-ring__center-label')?.textContent).toBe('Saldo');
    expect(center?.querySelector('.kc-ring__center-value')?.textContent).toBe('91,7%');
    const trend = center?.querySelector('.kc-trend');
    expect(trend?.classList.contains('kc-trend--up')).toBe(true);
    expect(trend?.classList.contains('kc-tone--success')).toBe(true);
    expect(trend?.textContent?.trim()).toBe('+3,8%');

    rerender(<RingChart items={RINGS} centerValue="12 de 25" />);
    expect(element.querySelector('.kc-ring__center-value')?.textContent).toBe('12 de 25');
    expect(element.querySelector('.kc-ring__center-label')).toBeNull();
    expect(element.querySelector('.kc-trend')).toBeNull();

    rerender(<RingChart items={RINGS} />);
    expect(element.querySelector('.kc-ring__center')).toBeNull();
  });

  it('lists names and formatted values in the legend, hidden with showLegend=false', () => {
    const { rerender } = mount();
    const items = Array.from(element.querySelectorAll('.kc-ring__legend-item'));
    expect(items).toHaveLength(3);
    expect(items[1].querySelector('.kc-ring__legend-name')?.textContent).toBe('Emitidas');
    expect(items[1].querySelector('.kc-ring__legend-value')?.textContent).toBe('94,2%');
    expect(items[1].querySelector('.kc-ring__legend-swatch')?.getAttribute('style')).toContain(
      'background',
    );
    expect(element.querySelector('ul.kc-ring__legend')).not.toBeNull();

    rerender(<RingChart items={RINGS} showLegend={false} />);
    expect(element.querySelector('.kc-ring__legend')).toBeNull();
  });

  it('emits onRingClick with the item and its index on click and Enter', () => {
    const clicks: [RingItem, number][] = [];
    mount({ onRingClick: (item, index) => clicks.push([item, index]) });
    fireEvent.click(arcs()[1]);
    fireEvent.keyDown(arcs()[2], { key: 'Enter' });
    fireEvent.keyDown(arcs()[0], { key: ' ' });
    expect(clicks).toEqual([
      [RINGS[1], 1],
      [RINGS[2], 2],
      [RINGS[0], 0],
    ]);
  });

  it('opens the tooltip on focus and closes it on blur', () => {
    mount();
    fireEvent.focus(arcs()[1]);
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.querySelector('.kc-tooltip__title')?.textContent).toBe('Emitidas');
    const row = tooltip?.querySelector('.kc-tooltip__row');
    expect(row?.classList.contains('kc-tooltip__row--active')).toBe(true);
    expect(row?.querySelector('.kc-tooltip__value')?.textContent).toBe('94,2%');
    // Anchored at the top of that ring: (cx, cy - r) at the rendered scale (200px of 200).
    expect((tooltip as HTMLElement).style.left).toBe('100px');
    expect(parseFloat((tooltip as HTMLElement).style.top)).toBeCloseTo(
      100 - num(arcs()[1], 'r'),
      2,
    );
    fireEvent.blur(arcs()[1]);
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('shows the empty state without items and the skeleton while loading', () => {
    const { rerender } = mount({ items: [] });
    expect(element.querySelector('svg')).toBeNull();
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');

    rerender(<RingChart items={RINGS} loading />);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
  });

  it('accepts a custom value format and locale', () => {
    mount({
      items: [{ name: 'Actas', value: 1200, max: 2000 }],
      valueFormat: {},
      locale: 'en-US',
    });
    expect(arcs()[0].getAttribute('aria-label')).toBe('Actas: 1,200');
    const [dash, circumference] = (arcs()[0].getAttribute('stroke-dasharray') ?? '')
      .split(' ')
      .map(Number);
    expect(dash / circumference).toBeCloseTo(0.6, 2);
  });
});
