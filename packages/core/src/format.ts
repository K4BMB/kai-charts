import { ValueFormat, ValueFormatter } from './types.js';

/**
 * Builds a value formatter. A function is used as is; Intl options are merged over
 * `{ maximumFractionDigits: 2 }` and applied with the given locale.
 */
export function createValueFormatter(locale: string, format?: ValueFormat): ValueFormatter {
  if (typeof format === 'function') return format;
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...format });
  return (value) => numberFormat.format(value);
}
