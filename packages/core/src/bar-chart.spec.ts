import { computeBarLayout } from './bar-layout.js';
import {
  barTooltip,
  isEmptyData,
  isLegendVisible,
  resolveSeries,
  toLegendItems,
  toggleHidden,
} from './bar-chart.js';

const categories = ['A', 'B'];
const series = [
  { name: 'S1', data: [1, 2] },
  { name: 'S2', data: [3, null], color: 'tomato' },
];

describe('isEmptyData', () => {
  it('treats zeros as data and only null/undefined as empty', () => {
    expect(isEmptyData(categories, [{ name: 'S', data: [0, 0] }])).toBe(false);
    expect(isEmptyData(categories, [{ name: 'S', data: [null, undefined] }])).toBe(true);
    expect(isEmptyData([], series)).toBe(true);
    expect(isEmptyData(categories, [])).toBe(true);
  });
});

describe('resolveSeries / toLegendItems', () => {
  it('assigns palette colors, keeps custom ones and drops hidden series', () => {
    const resolved = resolveSeries(series, new Set(['S1']));
    expect(resolved).toHaveLength(1);
    expect(resolved[0]).toMatchObject({ index: 1, name: 'S2', color: 'tomato' });
    const legend = toLegendItems(series, new Set(['S1']));
    expect(legend[0]).toEqual({ name: 'S1', color: 'var(--kc-color-1, #2563eb)', hidden: true });
    expect(legend[1].hidden).toBe(false);
  });

  it('toggles names without mutating the original set', () => {
    const hidden = new Set(['S1']);
    expect([...toggleHidden(hidden, 'S1')]).toEqual([]);
    expect([...toggleHidden(hidden, 'S2')]).toEqual(['S1', 'S2']);
    expect([...hidden]).toEqual(['S1']);
  });
});

describe('isLegendVisible', () => {
  it('shows the legend automatically only for 2+ series', () => {
    expect(isLegendVisible('auto', 1)).toBe(false);
    expect(isLegendVisible('auto', 2)).toBe(true);
    expect(isLegendVisible(true, 1)).toBe(true);
    expect(isLegendVisible(false, 3)).toBe(false);
  });
});

describe('barTooltip', () => {
  const format = (v: number) => `#${v}`;
  const resolved = resolveSeries(series);

  it('lists every visible series of the category and marks the active bar', () => {
    const layout = computeBarLayout({
      width: 600,
      height: 300,
      horizontal: false,
      stacked: false,
      showValues: false,
      barRadius: 0,
      categories,
      series: resolved,
      format,
    });
    const tooltip = barTooltip(layout, resolved, layout.bars[1], format);
    expect(tooltip.title).toBe('A');
    expect(tooltip.placement).toBe('top');
    expect(tooltip.rows).toEqual([
      { name: 'S1', value: '#1', color: 'var(--kc-color-1, #2563eb)', active: false },
      { name: 'S2', value: '#3', color: 'tomato', active: true },
    ]);
  });

  it('flips to the left near the right edge when horizontal', () => {
    const layout = computeBarLayout({
      width: 600,
      height: 300,
      horizontal: true,
      stacked: false,
      showValues: false,
      barRadius: 0,
      categories,
      series: resolved,
      format,
    });
    const longest = layout.bars.find((b) => b.value === 3)!;
    expect(barTooltip(layout, resolved, longest, format).placement).toBe('left');
    const shortest = layout.bars.find((b) => b.value === 1)!;
    expect(barTooltip(layout, resolved, shortest, format).placement).toBe('right');
  });
});
