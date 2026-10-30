import { createValueFormatter } from './format.js';
import { computeRingLayout } from './ring-layout.js';

const percent = createValueFormatter('es-VE', { style: 'percent', maximumFractionDigits: 1 });

describe('computeRingLayout', () => {
  const items = [
    { name: 'Saldo', value: 0.917 },
    { name: 'Emitidas', value: 0.72, color: 'teal' },
    { name: 'Recibidas', value: 1.4 },
  ];

  it('nests rings from the outside in with a shared thickness and gap', () => {
    const layout = computeRingLayout({ size: 200, items, format: percent });
    expect(layout.cx).toBe(100);
    expect(layout.rings.map((r) => r.name)).toEqual(['Saldo', 'Emitidas', 'Recibidas']);
    const [a, b, c] = layout.rings;
    expect(a.r).toBeGreaterThan(b.r);
    expect(b.r - c.r).toBeCloseTo(a.r - b.r, 2);
    expect(a.r - b.r).toBeCloseTo(layout.thickness + 4, 2);
    expect(layout.innerRadius).toBeGreaterThan(40); // room for the center text
  });

  it('maps value/max to the visible dash and clamps to a full circle', () => {
    const layout = computeRingLayout({ size: 200, items, format: percent });
    const [a, , c] = layout.rings;
    expect(a.percent).toBe(0.917);
    expect(a.dash).toBeCloseTo(a.circumference * 0.917, 1);
    expect(a.valueText).toBe('91,7%');
    expect(c.percent).toBe(1);
    expect(c.dash).toBe(c.circumference);
  });

  it('uses palette colors by default, custom colors when given, and a custom max', () => {
    const layout = computeRingLayout({
      size: 200,
      items: [{ name: 'Actas', value: 32654, max: 34653 }],
      format: createValueFormatter('es-VE'),
    });
    expect(layout.rings[0]).toMatchObject({ valueText: '32.654', ariaLabel: 'Actas: 32.654' });
    expect(layout.rings[0].percent).toBeCloseTo(0.9423, 3);
    expect(computeRingLayout({ size: 200, items, format: percent }).rings[1].color).toBe('teal');
    expect(computeRingLayout({ size: 200, items, format: percent }).rings[0].color).toBe(
      'var(--kc-color-1, #2563eb)',
    );
  });

  it('respects an explicit thickness and survives empty input or a zero max', () => {
    const thick = computeRingLayout({ size: 200, items, format: percent, thickness: 10, gap: 2 });
    expect(thick.thickness).toBe(10);
    expect(thick.rings[0].r - thick.rings[1].r).toBeCloseTo(12, 2);
    expect(computeRingLayout({ size: 200, items: [], format: percent }).rings).toEqual([]);
    const zero = computeRingLayout({
      size: 200,
      items: [{ name: 'x', value: 3, max: 0 }],
      format: percent,
    });
    expect(zero.rings[0].percent).toBe(0);
  });
});
