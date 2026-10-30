import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { createValueFormatter, describeTrend, type ValueFormat } from 'kai-charts-core';
import { useKaiChartsConfig } from './config';
import { Trend } from './trend';

export interface KpiCardProps {
  /** Short description of the indicator (`Jornadas ejecutadas`). */
  label: string;
  /** Numbers are formatted with `valueFormat`; strings are rendered as they come. */
  value: number | string;
  /** Secondary line next to the trend (`en el período`). */
  subtext?: string;
  /** Variation of the indicator; a ratio by default (`0.12` → `+12%`), see `trendFormat`. */
  trend?: number;
  /** `Intl.NumberFormat` options or a `(value) => string` for the trend (default `KC_TREND_FORMAT`). */
  trendFormat?: ValueFormat;
  /** Going down is the good news (costs, incidents, waiting time). */
  invertTrend?: boolean;
  /** `Intl.NumberFormat` options or a custom `(value) => string` for the value. */
  valueFormat?: ValueFormat;
  /** Locale for `Intl` formatting (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** Accent color of the icon circle (`--kc-kpi-accent`). */
  color?: string;
  /** Replace the texts by skeleton blocks and mark the card `aria-busy`. */
  loading?: boolean;
  /** Icon rendered inside the tinted circle (any node, typically an inline `<svg>`). */
  icon?: ReactNode;
  /** Extra classes for the root element (which always carries `kc-chart kc-kpi`). */
  className?: string;
  style?: CSSProperties;
}

const SKELETON_TEXT = '\u00a0';

/**
 * KPI card: label, formatted value, optional trend chip and subtext, optional icon. Same DOM
 * as the Angular `kc-kpi-card` so `kai-charts-core/styles/kpi-card.css` serves both.
 *
 * ```tsx
 * <KpiCard label="Jornadas ejecutadas" value={128} trend={0.12} subtext="vs período anterior" />
 * ```
 */
export function KpiCard({
  label,
  value,
  subtext = '',
  trend,
  trendFormat,
  invertTrend = false,
  valueFormat,
  locale,
  color,
  loading = false,
  icon,
  className,
  style,
}: KpiCardProps) {
  const config = useKaiChartsConfig();
  const resolvedLocale = locale ?? config.locale;
  const formatter = useMemo(
    () => createValueFormatter(resolvedLocale, valueFormat),
    [resolvedLocale, valueFormat],
  );
  const trendView = useMemo(
    () =>
      typeof trend === 'number'
        ? describeTrend(trend, resolvedLocale, trendFormat, invertTrend)
        : null,
    [trend, resolvedLocale, trendFormat, invertTrend],
  );
  const rootStyle = useMemo<CSSProperties | undefined>(
    () => (color ? ({ ...style, '--kc-kpi-accent': color } as CSSProperties) : style),
    [style, color],
  );

  const classes = ['kc-chart', 'kc-kpi'];
  if (loading) classes.push('kc-kpi--loading');
  if (className) classes.push(className);
  const valueText = typeof value === 'number' ? formatter(value) : value;
  const hasMeta = trendView !== null || subtext !== '';

  // Loading keeps the geometry: the three text blocks become skeletons (painted by the CSS).
  const body = loading ? (
    <>
      <div className="kc-kpi__label">{SKELETON_TEXT}</div>
      <div className="kc-kpi__value">{SKELETON_TEXT}</div>
      <div className="kc-kpi__meta">{SKELETON_TEXT}</div>
    </>
  ) : (
    <>
      <div className="kc-kpi__label">{label}</div>
      <div className="kc-kpi__value">{valueText}</div>
      {hasMeta && (
        <div className="kc-kpi__meta">
          {trendView && <Trend trend={trendView} />}
          {subtext !== '' && <span className="kc-kpi__subtext">{subtext}</span>}
        </div>
      )}
    </>
  );

  return (
    <div
      className={classes.join(' ')}
      style={rootStyle}
      role={loading ? 'status' : undefined}
      aria-busy={loading ? 'true' : undefined}
    >
      {icon !== undefined && icon !== null && (
        <div className="kc-kpi__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="kc-kpi__body">{body}</div>
    </div>
  );
}
