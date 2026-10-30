import { useMemo, type CSSProperties, type KeyboardEvent } from 'react';
import {
  buildMonthGrid,
  shiftMonth,
  type CalendarDayView,
  type CalendarEvent,
  type CalendarKind,
} from 'kai-charts-core';
import { ChartState } from './chart-state';
import { useKaiChartsConfig } from './config';

/** Payload of `onMonthChange`: the month the host should navigate to (`month` is 1–12). */
export interface MonthChangeEvent {
  year: number;
  month: number;
}

export interface MonthCalendarProps {
  /** Year shown; defaults to the current local year. */
  year?: number;
  /** Month shown, 1–12; defaults to the current local month. */
  month?: number;
  /** Events placed on the days (`date` is ISO `YYYY-MM-DD`). */
  events?: readonly CalendarEvent[];
  /** Declared event kinds: legend entries and dot colors. */
  kinds?: readonly CalendarKind[];
  /** ISO date highlighted as selected. */
  selected?: string;
  /** ISO date considered today (defaults to the real local date; override in tests). */
  today?: string;
  /** First day of the week: 0 = Sunday … 6 = Saturday. Default Monday. */
  weekStartsOn?: number;
  /** Show the legend with one total per kind. */
  showLegend?: boolean;
  /** Show the previous/next month buttons. */
  showNav?: boolean;
  /** Free text under the legend; the part after the first `:` is rendered in bold. */
  footer?: string;
  /** Accessible name of the grid table. */
  label?: string;
  /** Locale for the month title and weekday names (defaults to the provider config, `es-VE`). */
  locale?: string;
  /** Replace the calendar by a skeleton with `aria-busy`. */
  loading?: boolean;
  /**
   * Called on click, Enter or Space over a day with its view (`iso`, `events`, `dots`…). Days
   * get the `--clickable` class only when provided.
   */
  onDayClick?: (day: CalendarDayView) => void;
  /**
   * Called by the nav buttons with the target month (`shiftMonth(year, month, ±1)`). The
   * calendar is controlled: the host must update `year`/`month`.
   */
  onMonthChange?: (event: MonthChangeEvent) => void;
  /** Extra classes for the root element (which always carries `kc-chart kc-calendar`). */
  className?: string;
  style?: CSSProperties;
}

const LOADING_HEIGHT = 320;
/** Reference week used by the core for the weekday labels: 2023-01-01 was a Sunday. */
const REFERENCE_SUNDAY = { year: 2023, month: 0, day: 1 };

/** Long weekday names (`lunes`) in column order, for the `abbr` of the headers. */
function longWeekdayNames(locale: string, weekStartsOn: number): string[] {
  const names = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const start = ((weekStartsOn % 7) + 7) % 7;
  return Array.from({ length: 7 }, (_, i) =>
    names.format(
      new Date(
        REFERENCE_SUNDAY.year,
        REFERENCE_SUNDAY.month,
        REFERENCE_SUNDAY.day + ((start + i) % 7),
      ),
    ),
  );
}

/** Footer text split at its first colon: `Cumplimiento:` + `89,3 %` (bold). */
function splitFooter(footer: string): { text: string; strong: string } {
  const colon = footer.indexOf(':');
  if (colon < 0) return { text: footer, strong: '' };
  return { text: footer.slice(0, colon + 1), strong: footer.slice(colon + 1).trim() };
}

/**
 * Month calendar with event dots per day and kind, a legend with totals and a navigable
 * month. The grid comes from `buildMonthGrid` in `kai-charts-core`; same DOM as the Angular
 * `kc-month-calendar`.
 *
 * The month is controlled: the previous/next buttons call `onMonthChange` with the target
 * `{ year, month }` and the host updates `year`/`month`.
 *
 * ```tsx
 * <MonthCalendar year={year} month={month} events={events} kinds={kinds}
 *   selected="2026-10-09" footer="Cumplimiento: 89,3 %" onMonthChange={setPeriod} />
 * ```
 */
export function MonthCalendar({
  year,
  month,
  events = [],
  kinds = [],
  selected,
  today,
  weekStartsOn = 1,
  showLegend = true,
  showNav = true,
  footer = '',
  label = '',
  locale,
  loading = false,
  onDayClick,
  onMonthChange,
  className,
  style,
}: MonthCalendarProps) {
  const config = useKaiChartsConfig();
  const resolvedLocale = locale ?? config.locale;
  const now = new Date();
  const resolvedYear = year ?? now.getFullYear();
  const resolvedMonth = month ?? now.getMonth() + 1;

  const grid = useMemo(
    () =>
      buildMonthGrid(resolvedYear, resolvedMonth, events, kinds, {
        weekStartsOn,
        today,
        selected,
        locale: resolvedLocale,
      }),
    [resolvedYear, resolvedMonth, events, kinds, weekStartsOn, today, selected, resolvedLocale],
  );
  const weekdayNames = useMemo(
    () => longWeekdayNames(resolvedLocale, weekStartsOn),
    [resolvedLocale, weekStartsOn],
  );
  const footerParts = useMemo(() => splitFooter(footer), [footer]);

  const clickable = onDayClick !== undefined;
  const activate = (day: CalendarDayView, event?: KeyboardEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    onDayClick?.(day);
  };
  const onDayKeyDown = (day: CalendarDayView, event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') activate(day, event);
  };
  const navigate = (delta: -1 | 1) =>
    onMonthChange?.(shiftMonth(resolvedYear, resolvedMonth, delta));

  const rootClass = className ? `kc-chart kc-calendar ${className}` : 'kc-chart kc-calendar';

  if (loading) {
    return (
      <div className={rootClass} style={style}>
        <ChartState kind="loading" height={LOADING_HEIGHT} text={config.loadingText} />
      </div>
    );
  }

  return (
    <div className={rootClass} style={style}>
      <div className="kc-calendar__head">
        {showNav && (
          <button
            type="button"
            className="kc-calendar__nav"
            aria-label="Mes anterior"
            onClick={() => navigate(-1)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
        )}
        <h3 className="kc-calendar__title" aria-live="polite">
          {grid.title}
        </h3>
        {showNav && (
          <button
            type="button"
            className="kc-calendar__nav"
            aria-label="Mes siguiente"
            onClick={() => navigate(1)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        )}
      </div>
      <table className="kc-calendar__grid" role="grid" aria-label={label || undefined}>
        <thead>
          <tr>
            {grid.weekdays.map((weekday, i) => (
              <th key={i} scope="col" className="kc-calendar__weekday" abbr={weekdayNames[i]}>
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((week, w) => (
            <tr key={w}>
              {week.map((day) => {
                const classes = ['kc-calendar__day'];
                if (!day.inMonth) classes.push('kc-calendar__day--outside');
                if (day.isToday) classes.push('kc-calendar__day--today');
                if (day.isSelected) classes.push('kc-calendar__day--selected');
                if (day.weekend) classes.push('kc-calendar__day--weekend');
                if (clickable) classes.push('kc-calendar__day--clickable');
                return (
                  <td key={day.iso} className="kc-calendar__cell">
                    <button
                      type="button"
                      className={classes.join(' ')}
                      aria-pressed={day.isSelected ? true : undefined}
                      aria-label={day.ariaLabel}
                      data-date={day.iso}
                      onClick={clickable ? () => activate(day) : undefined}
                      onKeyDown={clickable ? (event) => onDayKeyDown(day, event) : undefined}
                    >
                      <span className="kc-calendar__number">{day.day}</span>
                      <span className="kc-calendar__dots" aria-hidden="true">
                        {day.dots.map((dot) => (
                          <i
                            key={dot.kind}
                            className={
                              dot.count > 1
                                ? 'kc-calendar__dot kc-calendar__dot--many'
                                : 'kc-calendar__dot'
                            }
                            style={{ '--kc-dot-color': dot.color } as CSSProperties}
                          />
                        ))}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {showLegend && grid.kinds.length > 0 && (
        <ul className="kc-calendar__legend">
          {grid.kinds.map((kind) => (
            <li key={kind.kind} className="kc-calendar__legend-item">
              <i className="kc-calendar__legend-swatch" style={{ background: kind.color }} />
              {kind.name}
              <span className="kc-calendar__legend-total">{kind.total}</span>
            </li>
          ))}
        </ul>
      )}
      {footer !== '' && (
        <p className="kc-calendar__footer">
          {footerParts.text}
          {footerParts.strong !== '' && (
            <>
              {' '}
              <strong>{footerParts.strong}</strong>
            </>
          )}
        </p>
      )}
    </div>
  );
}
