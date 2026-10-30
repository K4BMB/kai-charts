import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { CHARTS, normalizeChartId } from './chart-ids';
import { BarSandbox } from './sandboxes/bar-sandbox';
import { CalendarSandbox } from './sandboxes/calendar-sandbox';
import { KpiSandbox } from './sandboxes/kpi-sandbox';
import { LineSandbox } from './sandboxes/line-sandbox';
import { MapSandbox } from './sandboxes/map-sandbox';
import { ProgressSandbox } from './sandboxes/progress-sandbox';
import { RankingSandbox } from './sandboxes/ranking-sandbox';
import { RingSandbox } from './sandboxes/ring-sandbox';
import { TableSandbox } from './sandboxes/table-sandbox';

/**
 * Playground shell: a chip picker (`#/playground/<chart>`) above one sandbox per component.
 * Every sandbox edits its data and options on the left, renders the chart live on the right and
 * generates the template to copy into a real app.
 *
 * The stylesheet is not encapsulated (every rule is scoped under `.playground`) so the shared
 * form/panel/stage classes reach the sandboxes and editors without duplicating the CSS per
 * component.
 */
@Component({
  selector: 'app-playground',
  imports: [
    BarSandbox,
    LineSandbox,
    RingSandbox,
    KpiSandbox,
    ProgressSandbox,
    RankingSandbox,
    TableSandbox,
    CalendarSandbox,
    MapSandbox,
  ],
  templateUrl: './playground.html',
  styleUrl: './playground.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'playground' },
})
export class Playground {
  /** Route param (`playground/:chart`, bound by `withComponentInputBinding()`). */
  readonly chart = input<string>('bar');

  protected readonly charts = CHARTS;
  protected readonly active = computed(() => normalizeChartId(this.chart()));
}
