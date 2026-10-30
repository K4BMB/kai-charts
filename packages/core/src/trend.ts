import { createValueFormatter } from './format.js';
import { ValueFormat } from './types.js';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendView {
  value: number;
  /** Formatted value, e.g. `+12 %`. */
  text: string;
  direction: TrendDirection;
  /** `success` when the movement is good, `danger` when it is bad, `neutral` when flat. */
  tone: 'success' | 'danger' | 'neutral';
}

/** Default trend format: signed percentage with one decimal at most (`+12,9 %`). */
export const KC_TREND_FORMAT: Intl.NumberFormatOptions = {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
};

/**
 * Describes a variation (ratio or absolute) for KPI cards and stat headers.
 * With `invert`, going down is the good news (costs, incidents, waiting time).
 */
export function describeTrend(
  value: number,
  locale: string,
  format: ValueFormat = KC_TREND_FORMAT,
  invert = false,
): TrendView {
  const text = createValueFormatter(locale, format)(value);
  const direction: TrendDirection = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  if (direction === 'flat') return { value, text, direction, tone: 'neutral' };
  const good = (direction === 'up') !== invert;
  return { value, text, direction, tone: good ? 'success' : 'danger' };
}
