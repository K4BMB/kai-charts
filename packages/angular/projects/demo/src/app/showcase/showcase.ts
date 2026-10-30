import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  CalendarDayView,
  ChartPointEvent,
  ItemClickEvent,
  KcBarChart,
  KcIcon,
  KcKpiCard,
  KcLineChart,
  KcMonthCalendar,
  KcProgressList,
  KcRankingList,
  KcRankingTable,
  KcRingChart,
  KcVenezuelaMap,
  MapDatum,
  MapRegionClickEvent,
  MonthChangeEvent,
  ProgressItem,
  RankingItem,
  RingItem,
  SortChangeEvent,
  TableRow,
  VENEZUELA_STATES,
} from 'kai-charts';
import {
  AGE_RANGE,
  CALENDAR_EVENTS,
  CALENDAR_KINDS,
  CITIZENS_BY_STATE,
  CITIZENS_MAP,
  DENSITY,
  KPIS,
  LINE_SAMPLE,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
  RANKING_TABLE_COLUMNS,
  RANKING_TABLE_ROWS,
  RINGS,
  SYNC_STATE,
} from '../sample-data';
import { KpiIcon } from './kpi-icon';

/** What the footer shows after a click on a bar, a point, a ring, a region, a row or a day. */
interface LastClick {
  category: string;
  series: string;
  value: number;
}

/** Interval of the "data arrival" simulation of the map, in ms. */
const ARRIVAL_INTERVAL = 500;

@Component({
  selector: 'app-showcase',
  imports: [
    KcBarChart,
    KcKpiCard,
    KcIcon,
    KcLineChart,
    KcMonthCalendar,
    KcProgressList,
    KcRankingList,
    KcRankingTable,
    KcRingChart,
    KcVenezuelaMap,
    KpiIcon,
  ],
  templateUrl: './showcase.html',
  styleUrl: './showcase.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Showcase {
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly showTable = signal(false);
  protected readonly lastClick = signal<LastClick | null>(null);

  protected readonly kpis = KPIS;
  protected readonly density = DENSITY;
  protected readonly citizensByState = CITIZENS_BY_STATE;
  protected readonly lineSample = LINE_SAMPLE;
  protected readonly rings = RINGS;
  protected readonly calendarKinds = CALENDAR_KINDS;
  protected readonly calendarEvents = CALENDAR_EVENTS;
  protected readonly tableColumns = RANKING_TABLE_COLUMNS;
  protected readonly tableRows = RANKING_TABLE_ROWS;
  protected readonly byType = PROCEDURES_BY_TYPE;
  protected readonly byTypePhase1 = PROCEDURES_BY_TYPE_PHASE_1;
  protected readonly byDay = PROCEDURES_BY_DAY;
  protected readonly syncState = SYNC_STATE;
  protected readonly ageRange = AGE_RANGE;
  protected readonly monthlyVariation = MONTHLY_VARIATION;
  protected readonly noData = NO_DATA;
  protected readonly percent: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 0,
  };

  /** Map data: starts with the sample and grows while the arrival simulation runs. */
  protected readonly mapData = signal<MapDatum[]>(CITIZENS_MAP);
  protected readonly simulating = signal(false);
  private arrivalTimer: ReturnType<typeof setInterval> | null = null;

  /** Controlled sort of the ranking table (updated on `sortChange`). */
  protected readonly sortBy = signal('procedures');
  protected readonly sortDirection = signal<'desc' | 'asc'>('desc');
  /** Controlled month of the calendar (updated on `monthChange`). */
  protected readonly year = signal(2026);
  protected readonly month = signal(10);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopSimulation());
  }

  /** Fills the states without data one every 500 ms with a random value (800–3.000). */
  protected simulateArrival(): void {
    this.stopSimulation();
    const present = new Set(this.mapData().map((d) => d.id));
    const pending = VENEZUELA_STATES.map((s) => s.id).filter((id) => !present.has(id));
    if (pending.length === 0) return;
    this.simulating.set(true);
    this.arrivalTimer = setInterval(() => {
      const id = pending.shift();
      if (id !== undefined) {
        const value = 800 + Math.round(Math.random() * 2200);
        this.mapData.update((data) => [...data, { id, value }]);
      }
      if (pending.length === 0) this.stopSimulation();
    }, ARRIVAL_INTERVAL);
  }

  protected resetMap(): void {
    this.stopSimulation();
    this.mapData.set(CITIZENS_MAP);
  }

  private stopSimulation(): void {
    if (this.arrivalTimer !== null) {
      clearInterval(this.arrivalTimer);
      this.arrivalTimer = null;
    }
    this.simulating.set(false);
  }

  protected onPointClick(event: ChartPointEvent): void {
    this.lastClick.set(event);
  }

  protected onDensityClick({ item }: ItemClickEvent<ProgressItem>): void {
    this.lastClick.set({ category: item.label, series: 'Densidad', value: item.value });
  }

  protected onRankingClick({ item }: ItemClickEvent<RankingItem>): void {
    this.lastClick.set({ category: item.label, series: 'Ciudadanos', value: item.value });
  }

  protected onRegionClick(event: MapRegionClickEvent): void {
    this.lastClick.set({ category: event.name, series: 'Ciudadanos', value: event.value ?? 0 });
  }

  protected onRingClick({ item }: ItemClickEvent<RingItem>): void {
    this.lastClick.set({ category: item.name, series: 'Atención nacional', value: item.value });
  }

  protected onSortChange({ key, direction }: SortChangeEvent): void {
    this.sortBy.set(key);
    this.sortDirection.set(direction);
  }

  protected onRowClick({ item }: ItemClickEvent<TableRow>): void {
    const procedures = item.values['procedures'];
    this.lastClick.set({
      category: item.label,
      series: 'Unidad móvil',
      value: typeof procedures === 'number' ? procedures : 0,
    });
  }

  protected onMonthChange({ year, month }: MonthChangeEvent): void {
    this.year.set(year);
    this.month.set(month);
  }

  protected onDayClick(day: CalendarDayView): void {
    this.lastClick.set({ category: day.iso, series: 'Día', value: day.events.length });
  }
}
