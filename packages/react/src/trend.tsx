import type { TrendView } from 'kai-charts-core';

export interface TrendProps {
  /** Result of `describeTrend(value, locale, format?, invert?)` from `kai-charts-core`. */
  trend: TrendView;
}

/**
 * Trend chip (arrow + signed text) used by `KpiCard`. Same markup as the Angular fragment so
 * `kai-charts-core/styles/trend.css` serves both renderers: the direction modifier rotates the
 * arrow and the tone modifier decides the color.
 */
export function Trend({ trend }: TrendProps) {
  return (
    <span className={`kc-trend kc-trend--${trend.direction} kc-tone--${trend.tone}`}>
      <svg
        className="kc-trend__arrow"
        viewBox="0 0 12 12"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9 9 3M4.5 3H9v4.5" />
      </svg>
      <span>{trend.text}</span>
    </span>
  );
}
