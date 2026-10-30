import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import {
  CalendarDayView,
  CalendarEvent,
  CalendarKind,
  buildMonthGrid,
  shiftMonth,
} from 'kai-charts-core';
import { optionalNumberAttribute } from '../core/attributes';
import { KcChartState } from '../core/chart-state';
import { KC_CONFIG } from '../core/config';

/** Payload of `monthChange`: the month the host should navigate to (`month` is 1–12). */
export interface MonthChangeEvent {
  year: number;
  month: number;
}

/** Footer text split at its first colon: `Cumplimiento:` + `89,3 %` (bold). */
interface FooterParts {
  text: string;
  strong: string;
}

/** Reference week used by the core for the weekday labels: 2023-01-01 was a Sunday. */
const REFERENCE_SUNDAY = { year: 2023, month: 0, day: 1 };

/**
 * Month calendar with event dots per day and kind, a legend with totals and a navigable
 * month. The grid comes from `buildMonthGrid` of `kai-charts-core`; this component only
 * binds signals to the template.
 *
 * The month is controlled: the previous/next buttons emit `monthChange` with the target
 * `{ year, month }` and the host updates `year`/`month`. Day buttons always emit `dayClick`
 * with the `CalendarDayView` (ISO date, events, dots…).
 *
 * ```html
 * <kc-month-calendar [year]="year()" [month]="month()" [events]="events" [kinds]="kinds"
 *   selected="2026-10-09" footer="Cumplimiento: 89,3 %" (monthChange)="go($event)" />
 * ```
 */
@Component({
  selector: 'kc-month-calendar',
  imports: [KcChartState],
  templateUrl: './month-calendar.html',
  styles: `
    @import 'kai-charts-core/styles/month-calendar.css';
    kc-month-calendar {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-calendar',
  },
})
export class KcMonthCalendar {
  private readonly config = inject(KC_CONFIG);
  /** Fallback period when `year`/`month` are not provided: the month at creation time. */
  private readonly now = new Date();

  /** Year shown; defaults to the current local year. */
  readonly year = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** Month shown, 1–12; defaults to the current local month. */
  readonly month = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** Events placed on the days (`date` is ISO `YYYY-MM-DD`). */
  readonly events = input<readonly CalendarEvent[]>([]);
  /** Declared event kinds: legend entries and dot colors. */
  readonly kinds = input<readonly CalendarKind[]>([]);
  /** ISO date highlighted as selected. */
  readonly selected = input<string | undefined>(undefined);
  /** ISO date considered today (defaults to the real local date; override in tests). */
  readonly today = input<string | undefined>(undefined);
  /** First day of the week: 0 = Sunday … 6 = Saturday. Default Monday. */
  readonly weekStartsOn = input(1, { transform: numberAttribute });
  /** Show the legend with one total per kind. */
  readonly showLegend = input(true, { transform: booleanAttribute });
  /** Show the previous/next month buttons. */
  readonly showNav = input(true, { transform: booleanAttribute });
  /** Free text under the legend; the part after the first `:` is rendered in bold. */
  readonly footer = input('');
  /** Accessible name of the grid table. */
  readonly label = input('');
  /** Locale for the month title and weekday names (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  readonly loading = input(false, { transform: booleanAttribute });

  /** Emitted on click, Enter or Space over a day with its view (`iso`, `events`, `dots`…). */
  readonly dayClick = output<CalendarDayView>();
  /** Emitted by the nav buttons with the target month; the host must update `year`/`month`. */
  readonly monthChange = output<MonthChangeEvent>();

  protected readonly loadingText = this.config.loadingText;

  private readonly resolvedLocale = computed(() => this.locale() ?? this.config.locale);
  /** Period actually rendered (inputs or the current month). */
  private readonly period = computed(() => ({
    year: this.year() ?? this.now.getFullYear(),
    month: this.month() ?? this.now.getMonth() + 1,
  }));

  protected readonly grid = computed(() => {
    const { year, month } = this.period();
    return buildMonthGrid(year, month, this.events(), this.kinds(), {
      weekStartsOn: this.weekStartsOn(),
      today: this.today(),
      selected: this.selected(),
      locale: this.resolvedLocale(),
    });
  });

  /** Long weekday names (`lunes`) for the `abbr` of the headers, in column order. */
  protected readonly weekdayNames = computed(() => {
    const names = new Intl.DateTimeFormat(this.resolvedLocale(), { weekday: 'long' });
    const start = (((this.weekStartsOn() % 7) + 7) % 7) as number;
    return Array.from({ length: 7 }, (_, i) =>
      names.format(
        new Date(
          REFERENCE_SUNDAY.year,
          REFERENCE_SUNDAY.month,
          REFERENCE_SUNDAY.day + ((start + i) % 7),
        ),
      ),
    );
  });

  protected readonly showLegendList = computed(() => this.showLegend() && this.kinds().length > 0);

  protected readonly footerParts = computed<FooterParts>(() => {
    const footer = this.footer();
    const colon = footer.indexOf(':');
    if (colon < 0) return { text: footer, strong: '' };
    return { text: footer.slice(0, colon + 1), strong: footer.slice(colon + 1).trim() };
  });

  protected activate(day: CalendarDayView, event?: Event): void {
    event?.preventDefault();
    this.dayClick.emit(day);
  }

  protected navigate(delta: -1 | 1): void {
    const { year, month } = this.period();
    this.monthChange.emit(shiftMonth(year, month, delta));
  }
}
