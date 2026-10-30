export interface NiceDomain {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

/** Picks a "nice" step (1, 2 or 5 × 10^n) so that `span / step` is close to `count`. */
export function tickStep(span: number, count: number): number {
  if (!(span > 0)) return 1;
  const rough = span / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const factor = residual >= 7.07 ? 10 : residual >= 3.16 ? 5 : residual >= 1.41 ? 2 : 1;
  return factor * magnitude;
}

/**
 * Expands `[min, max]` to nice tick values. By default the domain always includes zero (bars
 * must start at zero); pass `includeZero = false` for line charts that zoom into a range.
 * With `integer` the step never goes below 1 (counts should not show 0.5 ticks).
 */
export function niceDomain(
  min: number,
  max: number,
  count = 5,
  integer = false,
  includeZero = true,
): NiceDomain {
  let lo = Number.isFinite(min) ? (includeZero ? Math.min(0, min) : min) : 0;
  let hi = Number.isFinite(max) ? (includeZero ? Math.max(0, max) : max) : 0;
  if (hi < lo) [lo, hi] = [hi, lo];
  if (hi === lo) hi = lo + 1;
  let step = tickStep(hi - lo, count);
  if (integer && step < 1) step = 1;
  const niceMin = roundFloat(Math.floor(lo / step) * step);
  const niceMax = roundFloat(Math.ceil(hi / step) * step);
  const ticks: number[] = [];
  for (let i = 0; ; i++) {
    const value = roundFloat(niceMin + i * step);
    if (value > niceMax + step / 2) break;
    ticks.push(value);
  }
  return { min: niceMin, max: niceMax, step, ticks };
}

/** Linear map from domain `[d0, d1]` to range `[r0, r1]` (range may be inverted). */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  const span = d1 - d0 || 1;
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

function roundFloat(value: number): number {
  return Number(value.toPrecision(12));
}
