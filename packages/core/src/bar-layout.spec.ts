import { BarLayoutOptions, computeBarLayout } from './bar-layout.js';

const format = (value: number) => String(value);
/** Same 2-decimal rounding the layout applies to path numbers. */
const r2 = (n: number) => Math.round(n * 100) / 100;

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

  it('hides axes on demand and reclaims their margins', () => {
    const full = computeBarLayout(options());
    const bare = computeBarLayout(options({ showValueAxis: false, showCategoryAxis: false }));
    expect(bare.valueTicks).toEqual([]);
    expect(bare.categoryTicks).toEqual([]);
    expect(bare.gridLines.length).toBe(full.gridLines.length);
    expect(bare.plot.x).toBeLessThan(full.plot.x);
    expect(bare.plot.h).toBeGreaterThan(full.plot.h);
  });

  it('scales bar thickness with barWidth', () => {
    const single = [options().series[0]];
    const thin = computeBarLayout(options({ series: single, barWidth: 0.25 }));
    const wide = computeBarLayout(options({ series: single, barWidth: 1 }));
    expect(thin.bars[0].w).toBeCloseTo(wide.bars[0].w * 0.25, 0);
  });

  it('rounds only the far end of grouped bars: top for positives, bottom for negatives', () => {
    const layout = computeBarLayout(options({ barRadius: 4 }));
    const bar = layout.bars[0];
    expect(bar.radius).toBe(4);
    // Starts at the bottom-left, two arcs along the top edge, straight base (no arc).
    expect(bar.d).toBe(
      `M${bar.x},${r2(bar.y + bar.h)}V${r2(bar.y + 4)}A4,4 0 0 1 ${r2(bar.x + 4)},${bar.y}H${r2(bar.x + bar.w - 4)}A4,4 0 0 1 ${r2(bar.x + bar.w)},${r2(bar.y + 4)}V${r2(bar.y + bar.h)}Z`,
    );

    const negative = computeBarLayout(
      options({
        barRadius: 4,
        series: [{ index: 0, name: 'S1', color: 'red', data: [-10, 20, 30] }],
      }),
    ).bars[0];
    expect(negative.value).toBe(-10);
    // Arcs sit on the bottom edge; the top edge (on the baseline) is a straight H.
    expect(negative.d).toMatch(/^M[\d.]+,[\d.]+H[\d.]+V[\d.]+A4,4 0 0 1 .*A4,4 0 0 1 .*Z$/);
    expect(negative.d.indexOf('A')).toBeGreaterThan(negative.d.indexOf('H'));
  });

  it('rounds the right end of horizontal bars and the left end of negatives', () => {
    const layout = computeBarLayout(
      options({
        horizontal: true,
        barRadius: 3,
        series: [{ index: 0, name: 'S1', color: 'red', data: [10, -20, 30] }],
      }),
    );
    const [positive, negative] = layout.bars;
    expect(positive.d).toBe(
      `M${positive.x},${positive.y}H${r2(positive.x + positive.w - 3)}A3,3 0 0 1 ${r2(positive.x + positive.w)},${r2(positive.y + 3)}V${r2(positive.y + positive.h - 3)}A3,3 0 0 1 ${r2(positive.x + positive.w - 3)},${r2(positive.y + positive.h)}H${positive.x}Z`,
    );
    expect(
      negative.d.startsWith(`M${r2(negative.x + 3)},${negative.y}H${r2(negative.x + negative.w)}V`),
    ).toBe(true);
  });

  it('stacked: only the outermost segment is rounded, seams and base stay square', () => {
    const layout = computeBarLayout(options({ stacked: true, barRadius: 4 }));
    const [bottom, top] = layout.bars.filter((b) => b.categoryIndex === 0);
    expect(bottom.radius).toBe(0);
    expect(bottom.d).toBe(
      `M${bottom.x},${bottom.y}H${r2(bottom.x + bottom.w)}V${r2(bottom.y + bottom.h)}H${bottom.x}Z`,
    );
    expect(top.radius).toBe(4);
    expect(top.d).toContain('A4,4 0 0 1');
    // The seam is shared exactly: the top segment starts where the bottom one ends, no overlap.
    expect(top.y + top.h).toBeCloseTo(bottom.y, 2);
    // Category B has a single segment (S2 is null): it is the outermost one and is rounded.
    const single = layout.bars.filter((b) => b.categoryIndex === 1);
    expect(single).toHaveLength(1);
    expect(single[0].radius).toBe(4);
  });

  it('stacked with negatives: the lowest negative segment is rounded at the bottom', () => {
    const layout = computeBarLayout(
      options({
        stacked: true,
        barRadius: 4,
        series: [
          { index: 0, name: 'S1', color: 'red', data: [10, 20, 30] },
          { index: 1, name: 'S2', color: 'blue', data: [-5, -8, 25] },
        ],
      }),
    );
    const [positive, negative] = layout.bars.filter((b) => b.categoryIndex === 0);
    expect(positive.radius).toBe(4);
    expect(positive.d).toContain('A4,4 0 0 1');
    expect(negative.radius).toBe(4);
    // Negative: straight top (baseline), arcs at the bottom.
    expect(negative.d.indexOf('A')).toBeGreaterThan(negative.d.indexOf('H'));
  });

  it('clamps the radius to the bar: half the thickness and the full length of a tiny tip', () => {
    const tiny = computeBarLayout(
      options({
        stacked: true,
        barRadius: 6,
        series: [
          { index: 0, name: 'S1', color: 'red', data: [100, 100, 100] },
          { index: 1, name: 'S2', color: 'blue', data: [0.5, 0.5, 0.5] },
        ],
      }),
    );
    const tip = tiny.bars.find((b) => b.seriesIndex === 1)!;
    expect(tip.h).toBeLessThan(6);
    expect(tip.radius).toBe(tip.h);

    const thin = computeBarLayout(options({ barRadius: 50, barWidth: 0.1 })).bars[0];
    expect(thin.radius).toBe(Math.round((thin.w / 2) * 100) / 100);

    const square = computeBarLayout(options({ barRadius: 0 })).bars[0];
    expect(square.radius).toBe(0);
    expect(square.d).not.toContain('A');
  });

  it('skips zero-length segments when choosing the rounded one', () => {
    const layout = computeBarLayout(
      options({
        stacked: true,
        barRadius: 4,
        series: [
          { index: 0, name: 'S1', color: 'red', data: [10, 20, 30] },
          { index: 1, name: 'S2', color: 'blue', data: [0, 0, 0] },
        ],
      }),
    );
    const [first, zero] = layout.bars.filter((b) => b.categoryIndex === 0);
    expect(zero.value).toBe(0);
    expect(zero.radius).toBe(0);
    expect(first.radius).toBe(4);
  });
});
