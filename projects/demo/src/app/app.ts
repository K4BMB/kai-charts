import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ChartPointEvent, KcBarChart } from 'kai-charts';
import {
  AGE_RANGE,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
  SYNC_STATE,
} from './sample-data';

type Theme = 'light' | 'dark' | 'brand';

@Component({
  selector: 'app-root',
  imports: [KcBarChart],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);

  protected readonly theme = signal<Theme>('light');
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

  constructor() {
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.theme();
    });
  }

  protected setTheme(event: Event): void {
    this.theme.set((event.target as HTMLSelectElement).value as Theme);
  }

  protected onBarClick(event: ChartPointEvent): void {
    this.lastClick.set(event);
  }
}
