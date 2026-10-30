import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CalendarDayView, CalendarEvent, KcMonthCalendar, MonthChangeEvent } from 'kai-charts';
import { CALENDAR_EVENTS, CALENDAR_KINDS } from '../../sample-data';
import { CodeBox } from '../editors/code-box';
import { inputValue, setNumber, setOptionalNumber } from '../editors/dom';
import { EventStatus, SandboxEvent } from '../editors/event-status';
import { FormatFields } from '../editors/format-fields';
import { DEFAULT_LOCALE } from '../editors/formats';
import { EditorRow, RowsColumn, RowsEditor, cellNumber, cellString } from '../editors/rows-editor';
import { attr, bind, element, tsConst } from '../editors/snippet';

const DEFAULT_TODAY = '2026-10-09';

const COLUMNS: readonly RowsColumn[] = [
  { key: 'date', header: 'Fecha', type: 'text', placeholder: 'AAAA-MM-DD' },
  {
    key: 'kind',
    header: 'Tipo',
    type: 'select',
    options: CALENDAR_KINDS.map((k) => ({ value: k.kind, label: k.name })),
  },
  { key: 'count', header: 'Cantidad', type: 'number', min: 1, step: 1, random: { min: 1, max: 3 } },
];

/**
 * Sandbox of `kc-month-calendar`: one row per event over the fixed showcase kinds, controlled
 * month (nav clicks update `year`/`month`), `dayClick` and `monthChange` status.
 */
@Component({
  selector: 'app-calendar-sandbox',
  imports: [KcMonthCalendar, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './calendar-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarSandbox {
  protected readonly columns = COLUMNS;
  protected readonly kinds = CALENDAR_KINDS;
  protected readonly rows = signal<EditorRow[]>(
    CALENDAR_EVENTS.map((e) => ({ date: e.date, kind: e.kind, count: e.count ?? 1 })),
  );

  // Options
  protected readonly year = signal(2026);
  protected readonly month = signal(10);
  protected readonly selected = signal('2026-10-23');
  protected readonly today = signal(DEFAULT_TODAY);
  protected readonly weekStartsOn = signal(1);
  protected readonly showLegend = signal(true);
  protected readonly showNav = signal(true);
  protected readonly footer = signal('Cumplimiento: 89,3 %');
  protected readonly loading = signal(false);
  protected readonly label = signal('Calendario de jornadas');
  protected readonly locale = signal(DEFAULT_LOCALE);

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly events = computed<CalendarEvent[]>(() =>
    this.rows().map((r) => {
      const count = cellNumber(r['count']);
      return {
        date: cellString(r['date']),
        kind: cellString(r['kind']),
        count: count === undefined || count === 1 ? undefined : count,
      };
    }),
  );
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected readonly setOptionalNumber = setOptionalNumber;
  protected readonly setNumber = setNumber;

  protected newRow = (): EditorRow => ({
    date: `${this.year()}-${pad(this.month())}-15`,
    kind: CALENDAR_KINDS[0].kind,
    count: 1,
  });

  protected onDayClick(day: CalendarDayView): void {
    const n = day.events.length;
    this.lastEvent.set({
      name: 'dayClick',
      summary: `${day.iso} · ${n} ${n === 1 ? 'evento' : 'eventos'}`,
    });
  }

  protected onMonthChange({ year, month }: MonthChangeEvent): void {
    this.year.set(year);
    this.month.set(month);
    this.lastEvent.set({ name: 'monthChange', summary: `${year}-${pad(month)}` });
  }

  private buildSnippet(): string {
    const attrs = [
      attr('year', String(this.year())),
      attr('month', String(this.month())),
      '[events]="events"',
      '[kinds]="kinds"',
    ];
    if (this.selected()) attrs.push(attr('selected', this.selected()));
    if (this.today()) attrs.push(attr('today', this.today()));
    if (this.weekStartsOn() !== 1) attrs.push(attr('weekStartsOn', String(this.weekStartsOn())));
    if (!this.showLegend()) attrs.push(bind('showLegend', false));
    if (!this.showNav()) attrs.push(bind('showNav', false));
    if (this.footer()) attrs.push(attr('footer', this.footer()));
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(dayClick)="onDayClick($event)"', '(monthChange)="onMonthChange($event)"');
    return [
      element('kc-month-calendar', attrs),
      '',
      tsConst('kinds', 'CalendarKind', CALENDAR_KINDS),
      '',
      tsConst('events', 'CalendarEvent', this.events()),
    ].join('\n');
  }
}

function pad(month: number): string {
  return String(month).padStart(2, '0');
}
