import { LineLayoutOptions, computeLineLayout, linePath } from './line-layout.js';

const format = (value: number) => String(value);

function options(overrides: Partial<LineLayoutOptions> = {}): LineLayoutOptions {
  return {
    width: 600,
    height: 300,
    categories: ['May', 'Jun', 'Jul', 'Ago'],
    series: [
      { index: 0, name: 'S1', color: 'red', data: [10, 20, 15, 30] },
      { index: 1, name: 'S2', color: 'blue', data: [5, null, 25, 20] },
    ],
    format,
    ...overrides,
  };
}

describe('computeLineLayout', () => {
  it('creates one point per finite value and splits the line at gaps', () => {
    const layout = computeLineLayout(options());
    expect(layout.series[0].points).toHaveLength(4);
    expect(layout.series[1].points).toHaveLength(3);
    expect(layout.series[0].d.match(/M/g)).toHaveLength(1);
    expect(layout.series[1].d.match(/M/g)).toHaveLength(2);
    expect(layout.series[0].d.startsWith('M')).toBe(true);
    expect(layout.series[0].areaD).toBeNull();
  });

  it('spreads points from left to right and maps values to y', () => {
    const layout = computeLineLayout(options());
    const [p0, p1, , p3] = layout.series[0].points;
    expect(p1.x).toBeGreaterThan(p0.x);
    expect(p3.x).toBeGreaterThan(p1.x);
    expect(p3.y).toBeLessThan(p0.y); // 30 is higher than 10
    expect(layout.baselineY).toBeCloseTo(layout.plot.y + layout.plot.h, 1); // zero at the bottom
    expect(layout.axisLine.y1).toBe(layout.baselineY);
  });

  it('closes the area down to the baseline', () => {
    const layout = computeLineLayout(options({ area: true }));
    const area = layout.series[0].areaD!;
    expect(area.endsWith('Z')).toBe(true);
    expect(area).toContain(`${layout.baselineY}`);
    // S2 has a single-point run (May) that cannot form an area, plus a two-point run.
    expect(layout.series[1].areaD!.match(/Z/g)).toHaveLength(1);
  });

  it('uses cubic segments for the smooth curve and keeps points unchanged', () => {
    const linear = computeLineLayout(options());
    const smooth = computeLineLayout(options({ curve: 'smooth' }));
    expect(smooth.series[0].d).toContain('C');
    expect(linear.series[0].d).not.toContain('C');
    expect(smooth.series[0].points).toEqual(linear.series[0].points);
  });

  it('zooms into the data range when zero is excluded', () => {
    const withZero = computeLineLayout(options());
    const zoomed = computeLineLayout(options({ includeZero: false }));
    expect(withZero.valueTicks[0].label).toBe('0');
    expect(Number(zoomed.valueTicks[0].label)).toBeGreaterThan(0);
    expect(zoomed.baselineY).toBeCloseTo(zoomed.plot.y + zoomed.plot.h, 1);
  });

  it('adds end labels and reserves room for them', () => {
    const plain = computeLineLayout(options());
    const labelled = computeLineLayout(options({ showEndValues: true }));
    expect(labelled.endLabels.map((e) => e.text)).toEqual(['30', '20']);
    expect(labelled.plot.w).toBeLessThan(plain.plot.w);
  });

  it('hides axes on demand', () => {
    const bare = computeLineLayout(options({ showValueAxis: false, showCategoryAxis: false }));
    expect(bare.valueTicks).toEqual([]);
    expect(bare.categoryTicks).toEqual([]);
    expect(bare.gridLines.length).toBeGreaterThan(0);
  });

  it('labels points for assistive technology', () => {
    const layout = computeLineLayout(options());
    expect(layout.series[0].points[0].ariaLabel).toBe('May, S1: 10');
    const single = computeLineLayout(options({ series: [options().series[0]] }));
    expect(single.series[0].points[0].ariaLabel).toBe('May: 10');
  });

  it('survives empty data and a single category', () => {
    expect(computeLineLayout(options({ categories: [], series: [] })).series).toEqual([]);
    const one = computeLineLayout(
      options({ categories: ['A'], series: [{ index: 0, name: 'S', color: 'c', data: [4] }] }),
    );
    expect(one.series[0].points[0].x).toBeCloseTo(one.plot.x + one.plot.w / 2, 1);
  });
});

describe('linePath', () => {
  const pts = [
    { x: 0, y: 100 },
    { x: 50, y: 0 },
    { x: 100, y: 0 },
    { x: 150, y: 60 },
  ];

  it('joins points with straight lines', () => {
    expect(linePath(pts, 'linear')).toBe('M0 100L50 0L100 0L150 60');
    expect(linePath([pts[0]], 'smooth')).toBe('M0 100');
    expect(linePath([], 'linear')).toBe('');
  });

  it('keeps a flat segment flat (monotone: no overshoot)', () => {
    const d = linePath(pts, 'smooth');
    const segments = d.slice(1).split('C');
    // Segment between (50,0) and (100,0): both control points must stay on y = 0.
    const flat = segments[2].split(' ').map(Number);
    expect(flat[1]).toBe(0);
    expect(flat[3]).toBe(0);
  });
});
