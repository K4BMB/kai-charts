import { Tone, toneColor } from './tone.js';

/** An event placed on a calendar day. `date` is ISO `YYYY-MM-DD` (local, no time zone math). */
export interface CalendarEvent {
  date: string;
  /** Category key, matched against `CalendarKind.kind`. */
  kind: string;
  label?: string;
  count?: number;
}

/** Legend entry / dot style for an event kind. */
export interface CalendarKind {
  kind: string;
  name: string;
  tone?: Tone;
  color?: string;
}

export interface CalendarDot {
  kind: string;
  name: string;
  color: string;
  count: number;
}

export interface CalendarDayView {
  /** ISO date `YYYY-MM-DD`. */
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  weekend: boolean;
  dots: CalendarDot[];
  events: CalendarEvent[];
  ariaLabel: string;
}

export interface CalendarKindView extends CalendarKind {
  color: string;
  total: number;
}

export interface MonthGrid {
  year: number;
  /** 1–12 */
  month: number;
  /** e.g. `octubre de 2026` */
  title: string;
  /** Short weekday names in column order, e.g. `['lun', 'mar', …]`. */
  weekdays: string[];
  /** Always 6 rows × 7 days so the height is stable month to month. */
  weeks: CalendarDayView[][];
  kinds: CalendarKindView[];
  /** Events whose kind is not declared (still rendered with the first palette color). */
  unknownKinds: string[];
}

export interface MonthGridOptions {
  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday), the Venezuelan business convention. */
  weekStartsOn?: number;
  /** ISO date considered "today"; default: the current local date. */
  today?: string;
  /** ISO date drawn as selected. */
  selected?: string;
  locale?: string;
  /** Weekday label format: `short` = `lun`, `narrow` = `L`. */
  weekdayFormat?: 'short' | 'narrow';
}

/** Builds a 6-week grid for `year`/`month` with the events bucketed by day and kind. */
export function buildMonthGrid(
  year: number,
  month: number,
  events: readonly CalendarEvent[],
  kinds: readonly CalendarKind[],
  options: MonthGridOptions = {},
): MonthGrid {
  const locale = options.locale ?? 'es-VE';
  const weekStartsOn = (((options.weekStartsOn ?? 1) % 7) + 7) % 7;
  const today = options.today ?? toIso(new Date());
  const selected = options.selected;

  const kindViews: CalendarKindView[] = kinds.map((k) => ({
    ...k,
    color: toneColor(k.tone ?? 'neutral', k.color),
    total: 0,
  }));
  const kindIndex = new Map(kindViews.map((k) => [k.kind, k]));
  const unknown = new Set<string>();
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = byDay.get(event.date);
    if (list) list.push(event);
    else byDay.set(event.date, [event]);
    const kind = kindIndex.get(event.kind);
    if (kind) kind.total += event.count ?? 1;
    else unknown.add(event.kind);
  }

  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(year, month - 1, 1 - offset);
  const dayNames = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const weeks: CalendarDayView[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarDayView[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      const iso = toIso(date);
      const dayEvents = byDay.get(iso) ?? [];
      const dots = bucketDots(dayEvents, kindIndex);
      const label = `${dayNames.format(date)} ${date.getDate()}`;
      week.push({
        iso,
        day: date.getDate(),
        inMonth: date.getMonth() === month - 1,
        isToday: iso === today,
        isSelected: iso === selected,
        weekend: date.getDay() === 0 || date.getDay() === 6,
        dots,
        events: dayEvents,
        ariaLabel: dots.length
          ? `${label}: ${dots.map((dot) => `${dot.count} ${dot.name}`).join(', ')}`
          : label,
      });
    }
    weeks.push(week);
  }

  return {
    year,
    month,
    title: monthTitle(year, month, locale),
    weekdays: weekdayLabels(locale, weekStartsOn, options.weekdayFormat ?? 'short'),
    weeks,
    kinds: kindViews,
    unknownKinds: [...unknown],
  };
}

/** `octubre de 2026` for es-VE, `October 2026` for en-US. */
export function monthTitle(year: number, month: number, locale = 'es-VE'): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

/** Weekday labels starting at `weekStartsOn`, without the trailing dot some locales add. */
export function weekdayLabels(
  locale: string,
  weekStartsOn = 1,
  format: 'short' | 'narrow' = 'short',
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format });
  // 2023-01-01 was a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    formatter.format(new Date(2023, 0, 1 + ((weekStartsOn + i) % 7))).replace(/\.$/, ''),
  );
}

/** Moves `year`/`month` by `delta` months (negative allowed). */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

function bucketDots(events: CalendarEvent[], kinds: Map<string, CalendarKindView>): CalendarDot[] {
  const dots = new Map<string, CalendarDot>();
  for (const event of events) {
    const kind = kinds.get(event.kind);
    const existing = dots.get(event.kind);
    if (existing) {
      existing.count += event.count ?? 1;
      continue;
    }
    dots.set(event.kind, {
      kind: event.kind,
      name: kind?.name ?? event.kind,
      color: kind?.color ?? toneColor('neutral'),
      count: event.count ?? 1,
    });
  }
  return [...dots.values()];
}

function toIso(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
