import { AxisTick, Line, Rect, ResolvedSeries, ValueLabel } from './bar-layout.js';
import { niceDomain, scaleLinear } from './scale.js';
import { estimateTextWidth, round2, truncateLabel } from './text.js';
import { ChartValue, ValueFormatter } from './types.js';

export type CurveType = 'linear' | 'smooth';

export interface LineLayoutOptions {
  width: number;
  height: number;
  categories: readonly string[];
  series: readonly ResolvedSeries[];
  format: ValueFormatter;
  /** `smooth` = monotone cubic (no overshoot between points). Default `linear`. */
  curve?: CurveType;
  /** Fill the area between each line and the baseline. */
  area?: boolean;
  /** Force the value axis to include zero (default). `false` zooms into the data range. */
  includeZero?: boolean;
  showValueAxis?: boolean;
  showCategoryAxis?: boolean;
  /** Print the last value of each series next to its last point. */
  showEndValues?: boolean;
  pointRadius?: number;
  fontSize?: number;
}

export interface LinePoint {
  key: string;
  seriesIndex: number;
  categoryIndex: number;
  series: string;
  category: string;
  value: number;
  valueLabel: string;
  ariaLabel: string;
  color: string;
  x: number;
  y: number;
}

export interface LineSeriesShape {
  key: string;
  seriesIndex: number;
  name: string;
  color: string;
  /** Line path; gaps (`null` values) split it into several `M…` runs. */
  d: string;
  /** Closed area path down to the baseline, or `null` when `area` is off. */
  areaD: string | null;
  points: LinePoint[];
}

export interface LineLayout {
  width: number;
  height: number;
  plot: Rect;
  series: LineSeriesShape[];
  gridLines: Line[];
  valueTicks: AxisTick[];
  categoryTicks: AxisTick[];
  /** Baseline: zero when it is inside the domain, otherwise the bottom of the plot. */
  axisLine: Line;
  endLabels: ValueLabel[];
  baselineY: number;
}

const PAD = 10;
const TICK_GAP = 6;

/** Pure layout for the line chart (one or more series over shared categories). */
export function computeLineLayout(o: LineLayoutOptions): LineLayout {
  const fontSize = o.fontSize ?? 12;
  const pointRadius = o.pointRadius ?? 3;
  const showValueAxis = o.showValueAxis ?? true;
  const showCategoryAxis = o.showCategoryAxis ?? true;
  const includeZero = o.includeZero ?? true;
  const curve = o.curve ?? 'linear';
  const { categories, series, format } = o;
  const n = categories.length;

  // 1. Domain
  let min = Infinity;
  let max = -Infinity;
  let integer = true;
  for (const s of series) {
    for (const value of s.data) {
      if (!isFiniteValue(value)) continue;
      min = Math.min(min, value);
      max = Math.max(max, value);
      if (!Number.isInteger(value)) integer = false;
    }
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 0;
  }
  const tickCount = clamp(Math.round(o.height / 60), 2, 8);
  const domain = niceDomain(min, max, tickCount, integer, includeZero);
  const tickLabels = domain.ticks.map(format);

  // 2. Margins
  const endLabelTexts = o.showEndValues
    ? series.map((s) => {
        const last = [...s.data].reverse().find(isFiniteValue);
        return last === undefined ? '' : format(last);
      })
    : [];
  const left = showValueAxis ? maxWidth(tickLabels, fontSize) + TICK_GAP + 2 : PAD;
  const right = PAD + (o.showEndValues ? maxWidth(endLabelTexts, fontSize) + pointRadius + 6 : 0);
  const top = PAD + pointRadius;
  const bottom = showCategoryAxis ? fontSize + TICK_GAP + PAD : PAD + pointRadius;
  const plot: Rect = {
    x: left,
    y: top,
    w: Math.max(1, o.width - left - right),
    h: Math.max(1, o.height - top - bottom),
  };

  // 3. Scales: point scale on x (first and last points inset so labels fit), linear on y.
  const inset = n > 1 ? Math.min(plot.w * 0.06, maxWidth(categories, fontSize) / 2) : 0;
  const step = n > 1 ? (plot.w - 2 * inset) / (n - 1) : 0;
  const xFor = (i: number) => round2(n > 1 ? plot.x + inset + i * step : plot.x + plot.w / 2);
  const yScale = scaleLinear(domain.min, domain.max, plot.y + plot.h, plot.y);
  const yFor = (v: number) => round2(yScale(v));
  const baselineY = yFor(clamp(0, domain.min, domain.max));

  // 4. Series paths and points
  const shapes: LineSeriesShape[] = series.map((s) => {
    const points: LinePoint[] = [];
    const runs: LinePoint[][] = [];
    let run: LinePoint[] = [];
    for (let i = 0; i < n; i++) {
      const value = s.data[i];
      if (!isFiniteValue(value)) {
        if (run.length) runs.push(run);
        run = [];
        continue;
      }
      const valueLabel = format(value);
      const point: LinePoint = {
        key: `${s.index}-${i}`,
        seriesIndex: s.index,
        categoryIndex: i,
        series: s.name,
        category: categories[i],
        value,
        valueLabel,
        ariaLabel:
          series.length > 1
            ? `${categories[i]}, ${s.name}: ${valueLabel}`
            : `${categories[i]}: ${valueLabel}`,
        color: s.color,
        x: xFor(i),
        y: yFor(value),
      };
      points.push(point);
      run.push(point);
    }
    if (run.length) runs.push(run);
    const d = runs.map((r) => linePath(r, curve)).join(' ');
    const areaD = o.area
      ? runs
          .filter((r) => r.length > 1)
          .map(
            (r) =>
              `${linePath(r, curve)}L${r[r.length - 1].x} ${baselineY}L${r[0].x} ${baselineY}Z`,
          )
          .join(' ')
      : null;
    return {
      key: `s${s.index}`,
      seriesIndex: s.index,
      name: s.name,
      color: s.color,
      d,
      areaD,
      points,
    };
  });

  // 5. Axes, grid and end labels
  const gridLines: Line[] = [];
  const valueTicks: AxisTick[] = domain.ticks.map((tick, i) => {
    const y = yFor(tick);
    gridLines.push({ key: `g${i}`, x1: plot.x, y1: y, x2: round2(plot.x + plot.w), y2: y });
    return {
      key: `v${i}`,
      x: plot.x - TICK_GAP,
      y,
      anchor: 'end',
      label: tickLabels[i],
      title: tickLabels[i],
    };
  });
  const band = n > 1 ? step : plot.w;
  const categoryTicks: AxisTick[] = categories.map((category, i) => ({
    key: `c${i}`,
    x: xFor(i),
    y: round2(plot.y + plot.h + TICK_GAP + fontSize / 2),
    anchor: 'middle',
    label: truncateLabel(category, band - 4, fontSize),
    title: category,
  }));
  const axisLine: Line = {
    key: 'axis',
    x1: plot.x,
    y1: baselineY,
    x2: round2(plot.x + plot.w),
    y2: baselineY,
  };
  const endLabels: ValueLabel[] = o.showEndValues
    ? shapes.flatMap((s) => {
        const last = s.points[s.points.length - 1];
        if (!last) return [];
        return [
          {
            key: `e${s.seriesIndex}`,
            x: round2(last.x + pointRadius + 4),
            y: last.y,
            anchor: 'start' as const,
            text: last.valueLabel,
          },
        ];
      })
    : [];

  return {
    width: o.width,
    height: o.height,
    plot,
    series: shapes,
    gridLines,
    valueTicks: showValueAxis ? valueTicks : [],
    categoryTicks: showCategoryAxis ? categoryTicks : [],
    axisLine,
    endLabels,
    baselineY,
  };
}

/** SVG path through the points: straight segments or a monotone cubic spline. */
export function linePath(points: readonly { x: number; y: number }[], curve: CurveType): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  if (rest.length === 0 || curve === 'linear') {
    return `M${first.x} ${first.y}` + rest.map((p) => `L${p.x} ${p.y}`).join('');
  }
  const slopes = monotoneSlopes(points);
  let d = `M${first.x} ${first.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    d += `C${round2(p0.x + dx)} ${round2(p0.y + slopes[i] * dx)} ${round2(p1.x - dx)} ${round2(
      p1.y - slopes[i + 1] * dx,
    )} ${p1.x} ${p1.y}`;
  }
  return d;
}

/** Fritsch–Carlson tangents: the curve never overshoots the data between two points. */
function monotoneSlopes(points: readonly { x: number; y: number }[]): number[] {
  const n = points.length;
  const secants: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x || 1e-9;
    secants.push((points[i + 1].y - points[i].y) / dx);
  }
  const m: number[] = new Array(n).fill(0);
  m[0] = secants[0];
  m[n - 1] = secants[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = secants[i - 1] * secants[i] <= 0 ? 0 : (secants[i - 1] + secants[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (secants[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / secants[i];
    const b = m[i + 1] / secants[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * secants[i];
      m[i + 1] = t * b * secants[i];
    }
  }
  return m;
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
