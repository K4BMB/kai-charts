import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import {
  buildProgressRows,
  createValueFormatter,
  type ProgressItem,
  type ValueFormat,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { useKaiChartsConfig } from './config';

export interface ProgressListProps {
  /** Rows: `{ label, value, max?, tone?, color?, caption?, valueText? }`. */
  items?: readonly ProgressItem[];
  /** List maximum (defaults to the largest value, or each row's own `max`). */
  max?: number;
  /** Print the formatted value at the right of each label. */
  showValues?: boolean;
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
  /** Called on click, Enter or Space over a row; rows are focusable only when provided. */
  onItemClick?: (item: ProgressItem, index: number) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-progress`). */
  className?: string;
  style?: CSSProperties;
}

const ROW_HEIGHT = 56;

/**
 * Progress list: one bar per row with a traffic-light tone decided by the presenter. All
 * widths, colors and texts come from `buildProgressRows` in `kai-charts-core`; same DOM as the
 * Angular `kc-progress-list`.
 *
 * ```tsx
 * <ProgressList items={density} label="Densidad de atención" onItemClick={open} />
 * ```
 */
export function ProgressList({
  items = [],
  max,
  showValues = true,
  valueFormat,
  locale,
  label = '',
  loading = false,
  emptyText,
  onItemClick,
  className,
  style,
}: ProgressListProps) {
  const config = useKaiChartsConfig();
  const resolvedLocale = locale ?? config.locale;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const rows = useMemo(() => buildProgressRows(items, formatter, max), [items, formatter, max]);

  const clickable = onItemClick !== undefined;
  const activate = (index: number, event?: KeyboardEvent<HTMLLIElement>) => {
    event?.preventDefault();
    const item = items[index];
    if (item !== undefined) onItemClick?.(item, index);
  };
  const onRowKeyDown = (index: number, event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(index, event);
  };

  const rootClass = className ? `kc-chart kc-progress ${className}` : 'kc-chart kc-progress';
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
    content = rows.map((row, index) => (
      <li
        key={index}
        className={
          clickable
            ? `kc-progress__item kc-tone--${row.tone} kc-progress__item--clickable`
            : `kc-progress__item kc-tone--${row.tone}`
        }
        style={{ '--kc-row-color': row.color } as CSSProperties}
        tabIndex={clickable ? 0 : undefined}
        aria-label={row.ariaLabel}
        onClick={clickable ? () => activate(index) : undefined}
        onKeyDown={clickable ? (event) => onRowKeyDown(index, event) : undefined}
      >
        <div className="kc-progress__head">
          <span className="kc-progress__dot" aria-hidden="true" />
          <span className="kc-progress__label">{row.label}</span>
          {showValues && <span className="kc-progress__value">{row.valueText}</span>}
        </div>
        <div
          className="kc-progress__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={row.max}
          aria-valuenow={row.value}
          aria-label={row.ariaLabel}
        >
          <div className="kc-progress__bar" style={{ width: `${row.percent}%` }} />
        </div>
        {row.caption && <div className="kc-progress__caption">{row.caption}</div>}
      </li>
    ));
  }

  return (
    <ul
      className={rootClass}
      style={style}
      role={showList ? 'list' : undefined}
      aria-label={label || undefined}
    >
      {content}
    </ul>
  );
}
