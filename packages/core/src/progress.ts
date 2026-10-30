import { round2 } from './text.js';
import { Tone, clamp, toneColor } from './tone.js';
import { ValueFormatter } from './types.js';

/** One row of a progress list. */
export interface ProgressItem {
  label: string;
  value: number;
  /** Row maximum; defaults to the list `max` or the largest value in the list. */
  max?: number;
  /** Traffic-light tone, decided by the presenter (thresholds are business rules). */
  tone?: Tone;
  /** Any CSS color; overrides the tone color. */
  color?: string;
  /** Secondary line under the bar, e.g. `Desatendida · 280 trámites`. */
  caption?: string;
  /** Preformatted value; otherwise the chart formatter is applied. */
  valueText?: string;
}

export interface ProgressRowView {
  label: string;
  value: number;
  max: number;
  /** Bar width, 0–100. */
  percent: number;
  valueText: string;
  color: string;
  tone: Tone;
  caption?: string;
  ariaLabel: string;
}

/** Resolves widths, colors and texts of a progress list. Negative values render as 0 %. */
export function buildProgressRows(
  items: readonly ProgressItem[],
  format: ValueFormatter,
  max?: number,
): ProgressRowView[] {
  const listMax = max ?? Math.max(0, ...items.map((item) => item.max ?? item.value));
  return items.map((item) => {
    const rowMax = item.max ?? listMax;
    const percent = rowMax > 0 ? round2(clamp((item.value / rowMax) * 100, 0, 100)) : 0;
    const valueText = item.valueText ?? format(item.value);
    const tone = item.tone ?? 'neutral';
    return {
      label: item.label,
      value: item.value,
      max: rowMax,
      percent,
      valueText,
      color: toneColor(tone, item.color),
      tone,
      caption: item.caption,
      ariaLabel: `${item.label}: ${valueText}`,
    };
  });
}
