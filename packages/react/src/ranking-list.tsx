import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import {
  buildRankingRows,
  createValueFormatter,
  type RankingItem,
  type RankingRowView,
  type RankingSort,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { useKaiChartsConfig } from './config';

export interface RankingListProps {
  /** Entries: `{ id?, label, sublabel?, value, color? }`. */
  items?: readonly RankingItem[];
  /** Keep only the first N rows after sorting (Top N). */
  limit?: number;
  /** `desc` by default; `none` keeps the order of `items`. */
  sort?: RankingSort;
  /** Proportional bar under each row (relative to the first one). */
  showBars?: boolean;
  /** Rank badge at the left of each row. */
  showRank?: boolean;
  /** `Intl.NumberFormat` options or a custom `(value) => string`. */
  valueFormat?: ValueFormat;
  /** Locale for `Intl` formatting (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** Accessible name of the list. */
  label?: string;
  /** Replace the rows by a skeleton with `aria-busy`. */
  loading?: boolean;
  /** Empty-state text (defaults to the provider config). */
  emptyText?: string;
  /**
   * Called on click, Enter or Space over a row with the ORIGINAL item (matched by `id`, or by
   * `label` when there is no id) and its index in `items` (not the rendered position: the list
   * may be sorted and limited). Rows are focusable only when provided.
   */
  onItemClick?: (item: RankingItem, index: number) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-ranking`). */
  className?: string;
  style?: CSSProperties;
}

const ROW_HEIGHT = 52;

/**
 * Ranking list (Top N): rank badge, label, optional sublabel, formatted value and a bar
 * proportional to the first row. Sorting, limiting and widths come from `buildRankingRows` in
 * `kai-charts-core`; same DOM as the Angular `kc-ranking-list`.
 *
 * ```tsx
 * <RankingList items={citizensByState} limit={5} label="Ciudadanos atendidos por estado" />
 * ```
 */
export function RankingList({
  items = [],
  limit,
  sort = 'desc',
  showBars = true,
  showRank = true,
  valueFormat,
  locale,
  label = '',
  loading = false,
  emptyText,
  onItemClick,
  className,
  style,
}: RankingListProps) {
  const config = useKaiChartsConfig();
  const resolvedLocale = locale ?? config.locale;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const rows = useMemo(
    () => buildRankingRows(items, formatter, { limit, sort }),
    [items, formatter, limit, sort],
  );

  const clickable = onItemClick !== undefined;
  const activate = (row: RankingRowView, event?: KeyboardEvent<HTMLLIElement>) => {
    event?.preventDefault();
    const index = items.findIndex((candidate) => (candidate.id ?? candidate.label) === row.id);
    if (index >= 0) onItemClick?.(items[index], index);
  };
  const onRowKeyDown = (row: RankingRowView, event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(row, event);
  };

  const rootClass = className ? `kc-chart kc-ranking ${className}` : 'kc-chart kc-ranking';
  const showList = !loading && rows.length > 0;
  let content;
  if (loading) {
    content = (
      <ChartState
        kind="loading"
        height={items.length * ROW_HEIGHT || 160}
        text={config.loadingText}
      />
    );
  } else if (!showList) {
    content = <ChartState kind="empty" height={120} text={emptyText ?? config.emptyText} />;
  } else {
    content = rows.map((row) => {
      const classes = ['kc-ranking__item'];
      if (row.rank === 1) classes.push('kc-ranking__item--first');
      if (clickable) classes.push('kc-ranking__item--clickable');
      return (
        <li
          key={row.id}
          className={classes.join(' ')}
          style={{ '--kc-row-color': row.color } as CSSProperties}
          tabIndex={clickable ? 0 : undefined}
          aria-label={row.ariaLabel}
          onClick={clickable ? () => activate(row) : undefined}
          onKeyDown={clickable ? (event) => onRowKeyDown(row, event) : undefined}
        >
          {showRank && (
            <span className="kc-ranking__rank" aria-hidden="true">
              {row.rank}
            </span>
          )}
          <div className="kc-ranking__body">
            <div className="kc-ranking__head">
              <span className="kc-ranking__label">{row.label}</span>
              {row.sublabel && <span className="kc-ranking__sublabel">{row.sublabel}</span>}
              <span className="kc-ranking__value">{row.valueText}</span>
            </div>
            {showBars && (
              <div className="kc-ranking__track" aria-hidden="true">
                <div className="kc-ranking__bar" style={{ width: `${row.percent}%` }} />
              </div>
            )}
          </div>
        </li>
      );
    });
  }

  return (
    <ol
      className={rootClass}
      style={style}
      role={showList ? 'list' : undefined}
      aria-label={label || undefined}
    >
      {content}
    </ol>
  );
}
