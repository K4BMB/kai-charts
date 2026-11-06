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
  KcStateMap,
  KcVenezuelaMap,
  MapDatum,
  MapRegionClickEvent,
  MonthChangeEvent,
  ProgressItem,
  RankingItem,
  RegionMapGeometry,
  RingItem,
  STATE_MAPS,
  SortChangeEvent,
  TableRow,
  loadStateMap,
} from 'kai-charts';
import {
  AGE_RANGE,
  CALENDAR_EVENTS,
  CALENDAR_KINDS,
  CITIZENS_BY_STATE,
  ARRIVAL_SEQUENCE,
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
const ARRIVAL_INTERVAL = 400;
/** Delay before the simulation starts by itself after the page shows up, in ms. */
const ARRIVAL_DELAY = 800;

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
    KcStateMap,
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

  /** Map data: starts EMPTY (all grey) and grows while the arrival simulation runs. */
  protected readonly mapData = signal<MapDatum[]>([]);
  protected readonly simulating = signal(false);
  private arrivalTimer: ReturnType<typeof setInterval> | null = null;
  private autoStartTimer: ReturnType<typeof setTimeout> | null = null;

  /** State map card: the 26 states for the picker, the chosen one, its geometry and its data. */
  protected readonly stateOptions = STATE_MAPS;
  protected readonly stateId = signal('VE-V');
  protected readonly stateGeometry = signal<RegionMapGeometry | null>(null);
  protected readonly stateData = signal<MapDatum[]>([]);
  protected readonly stateSimulating = signal(false);
  private stateTimer: ReturnType<typeof setInterval> | null = null;
  private stateStartTimer: ReturnType<typeof setTimeout> | null = null;
  /** Request token: a quick change of state makes the previous chunk's response stale. */
  private stateRequest = 0;

  /** Controlled sort of the ranking table (updated on `sortChange`). */
  protected readonly sortBy = signal('procedures');
  protected readonly sortDirection = signal<'desc' | 'asc'>('desc');
  /** Controlled month of the calendar (updated on `monthChange`). */
  protected readonly year = signal(2026);
  protected readonly month = signal(10);

  constructor() {
    // The map starts grey and fills in by itself shortly after the page shows up: that is the
    // behaviour this component exists for, so the visitor sees it without clicking anything.
    this.autoStartTimer = setTimeout(() => this.simulateArrival(), ARRIVAL_DELAY);
    this.selectState(this.stateId());
    inject(DestroyRef).onDestroy(() => {
      this.stopSimulation();
      this.stopStateSimulation();
      if (this.autoStartTimer !== null) clearTimeout(this.autoStartTimer);
      if (this.stateStartTimer !== null) clearTimeout(this.stateStartTimer);
    });
  }

  /**
   * Loads the chosen state's geometry (one lazy chunk, cached by the core) and restarts the
   * municipality arrival once it is there: the host passes `[geometry]` so the component renders
   * synchronously instead of showing its own skeleton twice.
   */
  protected selectState(id: string): void {
    this.stateId.set(id);
    this.stopStateSimulation();
    this.stateData.set([]);
    this.stateGeometry.set(null);
    const request = ++this.stateRequest;
    loadStateMap(id).then((geometry) => {
      if (request !== this.stateRequest) return;
      this.stateGeometry.set(geometry);
      this.stateStartTimer = setTimeout(() => this.simulateStateArrival(), ARRIVAL_DELAY);
    });
  }

  /** Fills the municipalities one every 400 ms, in geometry order, with deterministic values. */
  protected simulateStateArrival(): void {
    this.stopStateSimulation();
    const geometry = this.stateGeometry();
    if (!geometry) return;
    this.stateData.set([]);
    const pending = geometry.regions.map((region, i) => ({
      id: region.id,
      value: 300 + ((i * 157) % 2500),
    }));
    this.stateSimulating.set(true);
    this.stateTimer = setInterval(() => {
      const next = pending.shift();
      if (next) this.stateData.update((data) => [...data, next]);
      if (pending.length === 0) this.stopStateSimulation();
    }, ARRIVAL_INTERVAL);
  }

  /** Stops the municipality arrival and leaves the state map grey again. */
  protected resetStateMap(): void {
    this.stopStateSimulation();
    this.stateData.set([]);
  }

  private stopStateSimulation(): void {
    if (this.stateTimer !== null) {
      clearInterval(this.stateTimer);
      this.stateTimer = null;
    }
    if (this.stateStartTimer !== null) {
      clearTimeout(this.stateStartTimer);
      this.stateStartTimer = null;
    }
    this.stateSimulating.set(false);
  }

  /** Replays the arrival: empties the map and adds one state every 400 ms until all 25 have a value. */
  protected simulateArrival(): void {
    this.stopSimulation();
    this.mapData.set([]);
    const pending = [...ARRIVAL_SEQUENCE];
    this.simulating.set(true);
    this.arrivalTimer = setInterval(() => {
      const next = pending.shift();
      if (next) this.mapData.update((data) => [...data, next]);
      if (pending.length === 0) this.stopSimulation();
    }, ARRIVAL_INTERVAL);
  }

  /** Stops the simulation and leaves the map grey again. */
  protected resetMap(): void {
    this.stopSimulation();
    this.mapData.set([]);
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

  /** A click on a state of the national map drills down into it on the state map below. */
  protected onRegionClick(event: MapRegionClickEvent): void {
    this.lastClick.set({ category: event.name, series: 'Ciudadanos', value: event.value ?? 0 });
    if (event.id !== this.stateId()) this.selectState(event.id);
  }

  protected onMunicipalityClick(event: MapRegionClickEvent): void {
    this.lastClick.set({
      category: event.code ? `${event.name} (${event.code})` : event.name,
      series: 'Ciudadanos',
      value: event.value ?? 0,
    });
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
