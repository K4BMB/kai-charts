import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ChartPointEvent, KcBarChart } from 'kai-charts';
import {
  AGE_RANGE,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
  SYNC_STATE,
} from '../sample-data';

@Component({
  selector: 'app-showcase',
  imports: [KcBarChart],
  templateUrl: './showcase.html',
  styleUrl: './showcase.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Showcase {
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly showTable = signal(false);
  protected readonly lastClick = signal<ChartPointEvent | null>(null);

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
}
