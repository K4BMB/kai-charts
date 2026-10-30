import { seriesColor } from './palette.js';
import { round2 } from './text.js';
import { clamp } from './tone.js';
import { ValueFormatter } from './types.js';

/** One entry of a ranking. */
export interface RankingItem {
  /** Stable id for events; defaults to the label. */
  id?: string;
  label: string;
  sublabel?: string;
  value: number;
  /** Any CSS color for the bar; defaults to the first palette color. */
  color?: string;
}

export type RankingSort = 'desc' | 'asc' | 'none';

export interface RankingOptions {
  /** Keep only the first N rows after sorting (Top N). */
  limit?: number;
  /** `desc` by default; `none` keeps the presenter order. */
  sort?: RankingSort;
}

export interface RankingRowView {
  rank: number;
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  valueText: string;
  /** Bar width relative to the first row, 0–100. */
  percent: number;
  color: string;
  ariaLabel: string;
}

/** Sorts, limits and resolves the rows of a ranking list. */
export function buildRankingRows(
  items: readonly RankingItem[],
  format: ValueFormatter,
  options: RankingOptions = {},
): RankingRowView[] {
  const sort = options.sort ?? 'desc';
  const sorted = [...items];
  if (sort !== 'none') {
    sorted.sort((a, b) => (sort === 'desc' ? b.value - a.value : a.value - b.value));
  }
  const rows = options.limit && options.limit > 0 ? sorted.slice(0, options.limit) : sorted;
  const max = Math.max(0, ...rows.map((item) => item.value));
  return rows.map((item, i) => {
    const valueText = format(item.value);
    return {
      rank: i + 1,
      id: item.id ?? item.label,
      label: item.label,
      sublabel: item.sublabel,
      value: item.value,
      valueText,
      percent: max > 0 ? round2(clamp((item.value / max) * 100, 0, 100)) : 0,
      color: item.color ?? seriesColor(0),
      ariaLabel: `${i + 1}. ${item.label}: ${valueText}`,
    };
  });
}
