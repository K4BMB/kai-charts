import { niceDomain, scaleLinear } from './scale.js';
import { estimateTextWidth, round2, truncateLabel } from './text.js';
import { ChartValue, ValueFormatter } from './types.js';

/** A series with its original index and resolved CSS color. */
export interface ResolvedSeries {
  index: number;
  name: string;
  color: string;
  data: readonly ChartValue[];
}

export interface BarLayoutOptions {
  width: number;
  height: number;
  horizontal: boolean;
  stacked: boolean;
  showValues: boolean;
  /**
   * Radius of the two corners at the far end of each bar (the end away from the baseline);
   * the base and, in stacks, every seam between segments stay square so a stack reads as one
   * bar. Stacked: only the outermost segment on each side is rounded. Clamped to the bar.
   */
  barRadius: number;
  categories: readonly string[];
  series: readonly ResolvedSeries[];
  format: ValueFormatter;
  fontSize?: number;
  /** Share of each category band occupied by bars, 0.1–1 (default 0.7). Thin bars: 0.25. */
  barWidth?: number;
  /** Hide ticks of the value axis and shrink its margin (grid lines are still computed). */
  showValueAxis?: boolean;
  /** Hide category labels and shrink their margin. */
  showCategoryAxis?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Line {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type TextAnchor = 'start' | 'middle' | 'end';

export interface AxisTick {
  key: string;
  x: number;
  y: number;
  anchor: TextAnchor;
  /** Possibly truncated text. */
  label: string;
  /** Full text, used as `<title>`. */
  title: string;
}

export interface BarShape extends Rect {
  key: string;
  seriesIndex: number;
  categoryIndex: number;
  series: string;
  category: string;
  value: number;
  valueLabel: string;
  ariaLabel: string;
  color: string;
  /** Effective radius of the far-end corners (0 = square; inner stack segments are always 0). */
  radius: number;
  /** SVG path of the bar: `x/y/w/h` with the far-end corners rounded by `radius`. */
  d: string;
}

export interface ValueLabel {
  key: string;
  x: number;
  y: number;
  anchor: TextAnchor;
  text: string;
}

export interface BarLayout {
  width: number;
  height: number;
  horizontal: boolean;
  plot: Rect;
  bars: BarShape[];
  gridLines: Line[];
  valueTicks: AxisTick[];
  categoryTicks: AxisTick[];
  axisLine: Line;
  valueLabels: ValueLabel[];
}

const PAD = 10;
const TICK_GAP = 6;
/** Share of each category band occupied by bars (the rest is spacing). */
const BAND_FILL = 0.7;

/**
 * Pure layout for the bar chart: value domain, margins, scales and every shape to draw.
 * Keeping it outside the component makes it fast to unit test and reusable (no DOM needed).
 */
export function computeBarLayout(o: BarLayoutOptions): BarLayout {
  const fontSize = o.fontSize ?? 12;
  const { horizontal, stacked, categories, series, format } = o;
  const categoryCount = categories.length;
  const seriesCount = series.length;
  const showValueAxis = o.showValueAxis ?? true;
  const showCategoryAxis = o.showCategoryAxis ?? true;
  const bandFill = clamp(o.barWidth ?? BAND_FILL, 0.1, 1);

  // 1. Value domain (grouped: raw values; stacked: per-category positive and negative sums).
  let min = 0;
  let max = 0;
  let integer = true;
  const formattedValues: string[] = [];
  for (let ci = 0; ci < categoryCount; ci++) {
    let positive = 0;
    let negative = 0;
    for (const s of series) {
      const value = s.data[ci];
      if (!isFiniteValue(value)) continue;
      if (!Number.isInteger(value)) integer = false;
      formattedValues.push(format(value));
      if (stacked) {
        if (value >= 0) positive += value;
        else negative += value;
      } else {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    if (stacked) {
      min = Math.min(min, negative);
      max = Math.max(max, positive);
    }
  }
  const valueAxisLength = horizontal ? o.width : o.height;
  const tickCount = clamp(Math.round(valueAxisLength / (horizontal ? 110 : 60)), 2, 8);
  const domain = niceDomain(min, max, tickCount, integer);
  const tickLabels = domain.ticks.map(format);

  // 2. Margins, estimated from label widths (SVG text cannot be measured before render).
  const tickLabelWidth = maxWidth(tickLabels, fontSize);
  const categoryLabelWidth = maxWidth(categories, fontSize);
  const valueLabelWidth = o.showValues ? maxWidth(formattedValues, fontSize) : 0;
  // Value labels of negative bars sit on the far side of the baseline: reserve room for them.
  const negativeLabelRoom = o.showValues && !stacked && min < 0;
  let left: number;
  let right: number;
  let top: number;
  let bottom = showCategoryAxis || horizontal ? fontSize + TICK_GAP + PAD : PAD;
  if (horizontal) {
    if (!showValueAxis) bottom = PAD;
    left = showCategoryAxis ? Math.min(categoryLabelWidth, o.width * 0.35) + TICK_GAP + 2 : PAD;
    if (negativeLabelRoom) left += valueLabelWidth + 4;
    right = PAD + (o.showValues ? valueLabelWidth + 4 : 0);
    top = PAD;
  } else {
    left = showValueAxis ? tickLabelWidth + TICK_GAP + 2 : PAD;
    right = PAD;
    top = PAD + (o.showValues ? fontSize + 4 : 0);
    if (negativeLabelRoom) bottom += fontSize + 4;
  }
  const plot: Rect = {
    x: left,
    y: top,
    w: Math.max(1, o.width - left - right),
    h: Math.max(1, o.height - top - bottom),
  };

  // 3. Scales: values along one axis, category bands along the other.
  const toPx = horizontal
    ? scaleLinear(domain.min, domain.max, plot.x, plot.x + plot.w)
    : scaleLinear(domain.min, domain.max, plot.y + plot.h, plot.y);
  const zero = toPx(0);
  const bandOrigin = horizontal ? plot.y : plot.x;
  const band = (horizontal ? plot.h : plot.w) / Math.max(1, categoryCount);
  const groupSize = band * bandFill;
  const slot = stacked ? groupSize : groupSize / Math.max(1, seriesCount);
  const gap = stacked || seriesCount === 1 ? 0 : Math.min(2, slot * 0.2);
  const thickness = Math.max(1, slot - gap);

  // 4. Bars and value labels.
  const bars: BarShape[] = [];
  const valueLabels: ValueLabel[] = [];
  const labelOffset = fontSize / 2 + 3;
  for (let ci = 0; ci < categoryCount; ci++) {
    const category = categories[ci];
    const groupStart = bandOrigin + ci * band + (band - groupSize) / 2;
    let positive = 0;
    let negative = 0;
    let drawn = 0;
    const firstBar = bars.length;
    for (let si = 0; si < seriesCount; si++) {
      const s = series[si];
      const value = s.data[ci];
      if (!isFiniteValue(value)) continue;
      drawn++;
      let from: number;
      let to: number;
      if (stacked) {
        if (value >= 0) {
          from = positive;
          positive += value;
          to = positive;
        } else {
          to = negative;
          negative += value;
          from = negative;
        }
      } else {
        from = Math.min(0, value);
        to = Math.max(0, value);
      }
      const p0 = toPx(from);
      const p1 = toPx(to);
      const along = stacked ? groupStart : groupStart + si * slot + gap / 2;
      const start = Math.min(p0, p1);
      const length = Math.abs(p1 - p0);
      const rect: Rect = horizontal
        ? { x: round2(start), y: round2(along), w: round2(length), h: round2(thickness) }
        : { x: round2(along), y: round2(start), w: round2(thickness), h: round2(length) };
      const valueLabel = format(value);
      const key = `${s.index}-${ci}`;
      bars.push({
        key,
        seriesIndex: s.index,
        categoryIndex: ci,
        series: s.name,
        category,
        value,
        valueLabel,
        ariaLabel:
          seriesCount > 1 ? `${category}, ${s.name}: ${valueLabel}` : `${category}: ${valueLabel}`,
        color: s.color,
        radius: 0,
        d: '',
        ...rect,
      });
      if (o.showValues && !stacked) {
        valueLabels.push(
          horizontal
            ? {
                key,
                x: round2(value >= 0 ? rect.x + rect.w + 4 : rect.x - 4),
                y: round2(rect.y + rect.h / 2),
                anchor: value >= 0 ? 'start' : 'end',
                text: valueLabel,
              }
            : {
                key,
                x: round2(rect.x + rect.w / 2),
                y: round2(value >= 0 ? rect.y - labelOffset : rect.y + rect.h + labelOffset),
                anchor: 'middle',
                text: valueLabel,
              },
        );
      }
    }
    if (o.showValues && stacked && drawn > 0) {
      const end = toPx(positive);
      const center = groupStart + groupSize / 2;
      const text = format(positive + negative);
      valueLabels.push(
        horizontal
          ? { key: `t-${ci}`, x: round2(end + 4), y: round2(center), anchor: 'start', text }
          : {
              key: `t-${ci}`,
              x: round2(center),
              y: round2(end - labelOffset),
              anchor: 'middle',
              text,
            },
      );
    }
    shapeBars(bars.slice(firstBar), o.barRadius, horizontal, stacked);
  }

  // 5. Axes: value ticks with grid lines, category ticks and the zero baseline.
  const gridLines: Line[] = [];
  const valueTicks: AxisTick[] = domain.ticks.map((tick, i) => {
    const p = round2(toPx(tick));
    const label = tickLabels[i];
    if (horizontal) {
      gridLines.push({ key: `g${i}`, x1: p, y1: plot.y, x2: p, y2: round2(plot.y + plot.h) });
      return {
        key: `v${i}`,
        x: p,
        y: round2(plot.y + plot.h + TICK_GAP + fontSize / 2),
        anchor: 'middle',
        label,
        title: label,
      };
    }
    gridLines.push({ key: `g${i}`, x1: plot.x, y1: p, x2: round2(plot.x + plot.w), y2: p });
    return { key: `v${i}`, x: plot.x - TICK_GAP, y: p, anchor: 'end', label, title: label };
  });
  // Category labels move away from the baseline when negative value labels need the space.
  const categoryShift = negativeLabelRoom ? (horizontal ? valueLabelWidth + 4 : fontSize + 4) : 0;
  const categoryTicks: AxisTick[] = categories.map((category, i) => {
    const center = round2(bandOrigin + i * band + band / 2);
    return horizontal
      ? {
          key: `c${i}`,
          x: round2(plot.x - TICK_GAP - categoryShift),
          y: center,
          anchor: 'end',
          label: truncateLabel(category, plot.x - TICK_GAP - categoryShift - 2, fontSize),
          title: category,
        }
      : {
          key: `c${i}`,
          x: center,
          y: round2(plot.y + plot.h + TICK_GAP + fontSize / 2 + categoryShift),
          anchor: 'middle',
          label: truncateLabel(category, band - 4, fontSize),
          title: category,
        };
  });
  const axisLine: Line = horizontal
    ? { key: 'axis', x1: round2(zero), y1: plot.y, x2: round2(zero), y2: round2(plot.y + plot.h) }
    : { key: 'axis', x1: plot.x, y1: round2(zero), x2: round2(plot.x + plot.w), y2: round2(zero) };

  return {
    width: o.width,
    height: o.height,
    horizontal,
    plot,
    bars,
    gridLines,
    valueTicks: showValueAxis ? valueTicks : [],
    categoryTicks: showCategoryAxis ? categoryTicks : [],
    axisLine,
    valueLabels,
  };
}

/** Which end of a bar is away from the baseline. */
export type BarEnd = 'top' | 'bottom' | 'left' | 'right';

/**
 * Gives every bar of one category its path. Grouped: each bar is rounded at its far end.
 * Stacked: only the outermost positive and the outermost negative segment are rounded, at
 * their outer end; the seams between segments and the base on the baseline stay square, so the
 * stack reads as a single bar instead of a pile of pills.
 */
function shapeBars(group: BarShape[], radius: number, horizontal: boolean, stacked: boolean): void {
  const farEnd = (positive: boolean): BarEnd =>
    horizontal ? (positive ? 'right' : 'left') : positive ? 'top' : 'bottom';
  const rounded = new Set<BarShape>();
  if (stacked) {
    const positives = group.filter((b) => b.value > 0);
    const negatives = group.filter((b) => b.value < 0);
    if (positives.length) rounded.add(positives[positives.length - 1]);
    if (negatives.length) rounded.add(negatives[negatives.length - 1]);
  } else {
    for (const bar of group) rounded.add(bar);
  }
  for (const bar of group) {
    const end = farEnd(bar.value >= 0);
    bar.radius = rounded.has(bar) ? clampRadius(bar, radius, end) : 0;
    bar.d = barPath(bar, bar.radius, end);
  }
}

/** The radius cannot exceed half the bar thickness nor the bar length. */
function clampRadius(rect: Rect, radius: number, end: BarEnd): number {
  const vertical = end === 'top' || end === 'bottom';
  const thickness = vertical ? rect.w : rect.h;
  const length = vertical ? rect.h : rect.w;
  return round2(Math.max(0, Math.min(radius, thickness / 2, length)));
}

/**
 * Path of a rectangle whose two corners at `end` are rounded by `radius` (0 → plain rectangle).
 * Drawn clockwise; shared by both renderers so a bar is the same shape everywhere.
 */
export function barPath(rect: Rect, radius: number, end: BarEnd): string {
  const x0 = round2(rect.x);
  const y0 = round2(rect.y);
  const x1 = round2(rect.x + rect.w);
  const y1 = round2(rect.y + rect.h);
  const r = round2(radius);
  if (r <= 0) return `M${x0},${y0}H${x1}V${y1}H${x0}Z`;
  const arc = `A${r},${r} 0 0 1 `;
  switch (end) {
    case 'top':
      return `M${x0},${y1}V${round2(y0 + r)}${arc}${round2(x0 + r)},${y0}H${round2(x1 - r)}${arc}${x1},${round2(y0 + r)}V${y1}Z`;
    case 'bottom':
      return `M${x0},${y0}H${x1}V${round2(y1 - r)}${arc}${round2(x1 - r)},${y1}H${round2(x0 + r)}${arc}${x0},${round2(y1 - r)}Z`;
    case 'right':
      return `M${x0},${y0}H${round2(x1 - r)}${arc}${x1},${round2(y0 + r)}V${round2(y1 - r)}${arc}${round2(x1 - r)},${y1}H${x0}Z`;
    case 'left':
      return `M${round2(x0 + r)},${y0}H${x1}V${y1}H${round2(x0 + r)}${arc}${x0},${round2(y1 - r)}V${round2(y0 + r)}${arc}${round2(x0 + r)},${y0}Z`;
  }
}

function isFiniteValue(value: ChartValue): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function maxWidth(texts: readonly string[], fontSize: number): number {
  let width = 0;
  for (const text of texts) width = Math.max(width, estimateTextWidth(text, fontSize));
  return width;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
