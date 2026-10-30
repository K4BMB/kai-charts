import { createValueFormatter } from './format.js';
import { buildProgressRows } from './progress.js';
import { buildRankingRows } from './ranking.js';
import { toneColor } from './tone.js';
import { describeTrend } from './trend.js';

const es = createValueFormatter('es-VE');

describe('toneColor', () => {
  it('maps tones to tokens with fallbacks and lets a custom color win', () => {
    expect(toneColor('success')).toBe('var(--kc-success, #16a34a)');
    expect(toneColor('danger')).toBe('var(--kc-danger, #dc2626)');
    expect(toneColor('neutral')).toBe('var(--kc-color-1, #2563eb)');
    expect(toneColor()).toBe('var(--kc-color-1, #2563eb)');
    expect(toneColor('warning', 'hotpink')).toBe('hotpink');
  });
});

describe('describeTrend', () => {
  it('formats a signed percentage and colors up as good by default', () => {
    expect(describeTrend(0.12, 'es-VE')).toEqual({
      value: 0.12,
      text: '+12%',
      direction: 'up',
      tone: 'success',
    });
    expect(describeTrend(-0.129, 'es-VE').text).toBe('-12,9%');
    expect(describeTrend(-0.129, 'es-VE').tone).toBe('danger');
  });

  it('inverts the meaning for metrics where going down is good', () => {
    expect(describeTrend(-0.05, 'es-VE', undefined, true).tone).toBe('success');
    expect(describeTrend(0.05, 'es-VE', undefined, true).tone).toBe('danger');
  });

  it('treats zero as flat and neutral, and accepts other formats', () => {
    expect(describeTrend(0, 'es-VE')).toMatchObject({ direction: 'flat', tone: 'neutral' });
    expect(describeTrend(340, 'es-VE', { signDisplay: 'always' }).text).toBe('+340');
  });
});

describe('buildProgressRows', () => {
  const items = [
    { label: 'Amazonas', value: 1.7, tone: 'danger' as const, caption: 'Desatendida' },
    { label: 'Bolívar', value: 4.1, tone: 'warning' as const },
    { label: 'Miranda', value: 21.3, tone: 'success' as const, color: '#0f0' },
    { label: 'Nada', value: -3 },
  ];

  it('scales widths against the largest value by default', () => {
    const rows = buildProgressRows(items, es);
    expect(rows.map((r) => r.percent)).toEqual([7.98, 19.25, 100, 0]);
    expect(rows[0]).toMatchObject({
      valueText: '1,7',
      color: 'var(--kc-danger, #dc2626)',
      caption: 'Desatendida',
      ariaLabel: 'Amazonas: 1,7',
    });
    expect(rows[2].color).toBe('#0f0');
    expect(rows[3].tone).toBe('neutral');
  });

  it('honours a list max and per-row max, clamping to 100', () => {
    const rows = buildProgressRows(
      [
        { label: 'A', value: 50 },
        { label: 'B', value: 30, max: 20 },
      ],
      es,
      100,
    );
    expect(rows[0]).toMatchObject({ percent: 50, max: 100 });
    expect(rows[1]).toMatchObject({ percent: 100, max: 20 });
  });

  it('uses a preformatted value when given', () => {
    expect(buildProgressRows([{ label: 'A', value: 1, valueText: '1 min' }], es)[0].valueText).toBe(
      '1 min',
    );
  });
});

describe('buildRankingRows', () => {
  const items = [
    { label: 'Lara', value: 3390 },
    { label: 'Zulia', value: 5260, id: 'VE-V' },
    { label: 'Miranda', value: 4940 },
    { label: 'Carabobo', value: 3540, color: 'teal' },
  ];

  it('sorts descending, ranks and scales bars against the first row', () => {
    const rows = buildRankingRows(items, es);
    expect(rows.map((r) => r.label)).toEqual(['Zulia', 'Miranda', 'Carabobo', 'Lara']);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(rows[0]).toMatchObject({ id: 'VE-V', percent: 100, valueText: '5.260' });
    expect(rows[1].percent).toBeCloseTo(93.92, 2);
    expect(rows[2].color).toBe('teal');
    expect(rows[3]).toMatchObject({ id: 'Lara', ariaLabel: '4. Lara: 3.390' });
  });

  it('limits to the top N and supports other orders', () => {
    expect(buildRankingRows(items, es, { limit: 2 }).map((r) => r.label)).toEqual([
      'Zulia',
      'Miranda',
    ]);
    expect(buildRankingRows(items, es, { sort: 'asc', limit: 1 })[0].label).toBe('Lara');
    expect(buildRankingRows(items, es, { sort: 'none' }).map((r) => r.label)).toEqual([
      'Lara',
      'Zulia',
      'Miranda',
      'Carabobo',
    ]);
  });

  it('survives an empty list', () => {
    expect(buildRankingRows([], es)).toEqual([]);
  });
});
