import { BarLayoutOptions, computeBarLayout } from './bar-layout';

const format = (value: number) => String(value);

function options(overrides: Partial<BarLayoutOptions> = {}): BarLayoutOptions {
  return {
    width: 600,
    height: 300,
    horizontal: false,
    stacked: false,
    showValues: false,
    barRadius: 2,
    categories: ['A', 'B', 'C'],
    series: [
      { index: 0, name: 'S1', color: 'red', data: [10, 20, 30] },
      { index: 1, name: 'S2', color: 'blue', data: [5, null, 25] },
    ],
    format,
    ...overrides,
  };
}

describe('computeBarLayout', () => {
  it('draws one bar per finite value and skips nulls', () => {
    const layout = computeBarLayout(options());
    expect(layout.bars.map((b) => b.key)).toEqual(['0-0', '1-0', '0-1', '0-2', '1-2']);
  });

  it('makes vertical bar heights proportional to values', () => {
    const layout = computeBarLayout(options());
    const [a, , b] = layout.bars.filter((bar) => bar.seriesIndex === 0);
    expect(b.h / a.h).toBeCloseTo(3, 2);
    expect(a.y + a.h).toBeCloseTo(layout.axisLine.y1, 1);
  });

  it('stacks series on top of each other', () => {
    const layout = computeBarLayout(options({ stacked: true }));
    const [s1, s2] = layout.bars.filter((bar) => bar.categoryIndex === 0);
    expect(s1.x).toBe(s2.x);
    expect(s1.w).toBe(s2.w);
    expect(s2.y + s2.h).toBeCloseTo(s1.y, 1);
    expect(layout.valueTicks.at(-1)?.label).toBe('60');
  });

  it('uses widths along the x axis when horizontal', () => {
    const layout = computeBarLayout(options({ horizontal: true }));
    const [a, , b] = layout.bars.filter((bar) => bar.seriesIndex === 0);
    expect(a.h).toBe(b.h);
    expect(b.w / a.w).toBeCloseTo(3, 2);
    expect(a.x).toBeCloseTo(layout.axisLine.x1, 1);
  });

  it('keeps the baseline at zero and draws negative bars downwards', () => {
    const layout = computeBarLayout(
      options({ series: [{ index: 0, name: 'S', color: 'red', data: [-10, 20, 0] }] }),
    );
    const [negative, positive] = layout.bars;
    expect(negative.y).toBeCloseTo(layout.axisLine.y1, 1);
    expect(positive.y + positive.h).toBeCloseTo(layout.axisLine.y1, 1);
    expect(layout.valueTicks[0]?.label).toBe('-10');
  });

  it('reserves room below the plot for negative value labels', () => {
    const series = [{ index: 0, name: 'S', color: 'red', data: [-10, 20, 0] }];
    const plain = computeBarLayout(options({ series, showValues: true }));
    const positiveOnly = computeBarLayout(
      options({ series: [{ ...series[0], data: [10, 20, 0] }], showValues: true }),
    );
    expect(plain.plot.h).toBeLessThan(positiveOnly.plot.h);
    const label = plain.valueLabels[0];
    expect(label.text).toBe('-10');
    expect(label.y).toBeLessThan(plain.categoryTicks[0].y - 8);
  });

  it('adds a value label per bar, or one total per stack', () => {
    expect(computeBarLayout(options({ showValues: true })).valueLabels).toHaveLength(5);
    const stacked = computeBarLayout(options({ showValues: true, stacked: true }));
    expect(stacked.valueLabels.map((v) => v.text)).toEqual(['15', '20', '55']);
  });

  it('truncates long category labels that do not fit their band', () => {
    const layout = computeBarLayout(
      options({ width: 200, categories: ['Unión estable de hecho', 'B', 'C'] }),
    );
    expect(layout.categoryTicks[0].label.endsWith('…')).toBe(true);
    expect(layout.categoryTicks[0].title).toBe('Unión estable de hecho');
  });

  it('labels bars for assistive technology', () => {
    const multi = computeBarLayout(options());
    expect(multi.bars[0].ariaLabel).toBe('A, S1: 10');
    const single = computeBarLayout(options({ series: [options().series[0]] }));
    expect(single.bars[0].ariaLabel).toBe('A: 10');
  });

  it('survives an empty dataset', () => {
    const layout = computeBarLayout(options({ categories: [], series: [] }));
    expect(layout.bars).toEqual([]);
    expect(layout.valueTicks.map((t) => t.label)).toEqual(['0', '1']);
  });
});
