import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ChartPointEvent,
  ItemClickEvent,
  KcBarChart,
  KcIcon,
  KcKpiCard,
  KcProgressList,
  KcRankingList,
  ProgressItem,
  RankingItem,
} from 'kai-charts';
import {
  AGE_RANGE,
  CITIZENS_BY_STATE,
  DENSITY,
  KPIS,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
  SYNC_STATE,
} from '../sample-data';
import { KpiIcon } from './kpi-icon';

/** What the footer shows after a click on a bar or on a list row. */
interface LastClick {
  category: string;
  series: string;
  value: number;
}

@Component({
  selector: 'app-showcase',
  imports: [KcBarChart, KcKpiCard, KcIcon, KcProgressList, KcRankingList, KpiIcon],
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

  protected onBarClick(event: ChartPointEvent): void {
    this.lastClick.set(event);
  }

  protected onDensityClick({ item }: ItemClickEvent<ProgressItem>): void {
    this.lastClick.set({ category: item.label, series: 'Densidad', value: item.value });
  }

  protected onRankingClick({ item }: ItemClickEvent<RankingItem>): void {
    this.lastClick.set({ category: item.label, series: 'Ciudadanos', value: item.value });
  }
}
