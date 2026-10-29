import { createValueFormatter } from './format.js';
import { seriesColor } from './palette.js';
import { truncateLabel } from './text.js';

describe('createValueFormatter', () => {
  it('uses es-VE grouping and at most two decimals by default', () => {
    const format = createValueFormatter('es-VE');
    expect(format(10000)).toBe('10.000');
    expect(format(1234.567)).toBe('1.234,57');
  });

  it('merges Intl options with the locale', () => {
    const format = createValueFormatter('es-VE', { style: 'percent', maximumFractionDigits: 0 });
    expect(format(0.256)).toBe('26%');
  });

  it('returns a custom formatter untouched', () => {
    const custom = (value: number) => `${value} actas`;
    expect(createValueFormatter('es-VE', custom)).toBe(custom);
  });
});

describe('seriesColor', () => {
  it('maps series to --kc-color-N tokens with a fallback and cycles after 8', () => {
    expect(seriesColor(0)).toBe('var(--kc-color-1, #2563eb)');
    expect(seriesColor(8)).toBe('var(--kc-color-1, #2563eb)');
    expect(seriesColor(7)).toBe('var(--kc-color-8, #64748b)');
  });

  it('keeps a custom color', () => {
    expect(seriesColor(3, '#123456')).toBe('#123456');
  });
});

describe('truncateLabel', () => {
  it('leaves short labels alone and cuts long ones with an ellipsis', () => {
    expect(truncateLabel('Matrimonio', 200)).toBe('Matrimonio');
    expect(truncateLabel('Unión estable de hecho', 60)).toBe('Unión e…');
  });
});
