import { seriesColor } from './palette.js';
import { round2 } from './text.js';
import { clamp } from './tone.js';
import { ValueFormatter } from './types.js';

/** One ring: `value / max` is the filled share (max defaults to 1, i.e. value is a ratio). */
export interface RingItem {
  name: string;
  value: number;
  max?: number;
  color?: string;
}

export interface RingLayoutOptions {
  /** Side of the square viewBox in px. */
  size: number;
  items: readonly RingItem[];
  format: ValueFormatter;
  /** Stroke width; by default computed so the rings leave a hole of ~45 % for the center text. */
  thickness?: number;
  /** Space between rings (default 4). */
  gap?: number;
}

export interface RingShape {
  key: string;
  index: number;
  name: string;
  color: string;
  r: number;
  circumference: number;
  /** Visible arc length (`stroke-dasharray="dash circumference"`). */
  dash: number;
  /** 0–1 */
  percent: number;
  value: number;
  max: number;
  valueText: string;
  ariaLabel: string;
}

export interface RingLayout {
  size: number;
  cx: number;
  cy: number;
  thickness: number;
  /** Radius of the empty center. */
  innerRadius: number;
  rings: RingShape[];
}

/** Concentric progress rings (outermost = first item). */
export function computeRingLayout(o: RingLayoutOptions): RingLayout {
  const n = o.items.length;
  const cx = o.size / 2;
  const outer = o.size / 2 - 2;
  const gap = o.gap ?? 4;
  const available = outer * 0.55;
  const thickness =
    o.thickness ?? clamp((available - gap * Math.max(0, n - 1)) / Math.max(1, n), 4, 18);
  const rings: RingShape[] = o.items.map((item, i) => {
    const r = outer - thickness / 2 - i * (thickness + gap);
    const max = item.max ?? 1;
    const percent = max > 0 ? clamp(item.value / max, 0, 1) : 0;
    const circumference = 2 * Math.PI * r;
    const valueText = o.format(item.value);
    return {
      key: `r${i}`,
      index: i,
      name: item.name,
      color: seriesColor(i, item.color),
      r: round2(r),
      circumference: round2(circumference),
      dash: round2(circumference * percent),
      percent: Math.round(percent * 10000) / 10000,
      value: item.value,
      max,
      valueText,
      ariaLabel: `${item.name}: ${valueText}`,
    };
  });
  const innerRadius = round2(Math.max(0, outer - n * thickness - Math.max(0, n - 1) * gap));
  return { size: o.size, cx, cy: cx, thickness: round2(thickness), innerRadius, rings };
}
