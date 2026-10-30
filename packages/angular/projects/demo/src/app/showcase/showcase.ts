import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import {
  ChartPointEvent,
  ItemClickEvent,
  KcBarChart,
  KcIcon,
  KcKpiCard,
  KcLineChart,
  KcProgressList,
  KcRankingList,
  KcRingChart,
  KcVenezuelaMap,
  MapDatum,
  MapMarker,
  MapRegionClickEvent,
  ProgressItem,
  RankingItem,
  RingItem,
  VENEZUELA_STATES,
} from 'kai-charts';
import {
  AGE_RANGE,
  CITIZENS_BY_STATE,
  CITIZENS_MAP,
  DENSITY,
  KPIS,
  LINE_SAMPLE,
  MOBILE_UNITS,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
  RINGS,
  SYNC_STATE,
} from '../sample-data';
import { KpiIcon } from './kpi-icon';

/** What the footer shows after a click on a bar, a point, a ring, a region or a list row. */
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
    KcProgressList,
    KcRankingList,
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
  protected readonly mobileUnits = MOBILE_UNITS;
  /** The state ranked first is outlined on the map. */
  protected readonly topStateId =
    [...CITIZENS_BY_STATE].sort((a, b) => b.value - a.value)[0]?.id ?? '';
  protected readonly lineSample = LINE_SAMPLE;
  protected readonly rings = RINGS;
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

  protected onMarkerClick(marker: MapMarker): void {
    this.lastClick.set({
      category: marker.label ?? marker.id,
      series: 'Unidad móvil',
      value: marker.value ?? 0,
    });
  }

  protected onRingClick({ item }: ItemClickEvent<RingItem>): void {
    this.lastClick.set({ category: item.name, series: 'Atención nacional', value: item.value });
  }
}
