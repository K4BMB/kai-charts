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
  barRadius: number;
  categories: readonly string[];
  series: readonly ResolvedSeries[];
  format: ValueFormatter;
  fontSize?: number;
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
  rx: number;
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
  let bottom = fontSize + TICK_GAP + PAD;
  if (horizontal) {
    left = Math.min(categoryLabelWidth, o.width * 0.35) + TICK_GAP + 2;
    if (negativeLabelRoom) left += valueLabelWidth + 4;
    right = PAD + (o.showValues ? valueLabelWidth + 4 : 0);
    top = PAD;
  } else {
    left = tickLabelWidth + TICK_GAP + 2;
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
  const groupSize = band * BAND_FILL;
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
        rx: stacked ? 0 : o.barRadius,
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
    valueTicks,
    categoryTicks,
    axisLine,
    valueLabels,
  };
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
