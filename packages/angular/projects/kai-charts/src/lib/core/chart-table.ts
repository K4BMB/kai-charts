import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { ChartSeries, ValueFormatter } from 'kai-charts-core';

/**
 * Mirror table of a chart: the same data as an accessible, printable `<table>`.
 * Rendered by charts when `showTable` is on.
 */
@Component({
  selector: 'kc-chart-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="kc-table-wrap">
      <table class="kc-table">
        @if (caption()) {
          <caption>
            {{
              caption()
            }}
          </caption>
        }
        <thead>
          <tr>
            <th scope="col">{{ categoryHeader() }}</th>
            @for (s of series(); track $index) {
              <th scope="col">{{ s.name }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr>
              <th scope="row">{{ row.category }}</th>
              @for (cell of row.cells; track $index) {
                <td>{{ cell }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    @import 'kai-charts-core/styles/chart-table.css';
    kc-chart-table {
      display: block;
    }
  `,
})
export class KcChartTable {
  readonly categories = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly format = input.required<ValueFormatter>();
  readonly caption = input('');
  readonly categoryHeader = input('');
  /** Text for `null`/`undefined` cells. */
  readonly emptyText = input('—');

  protected readonly rows = computed(() => {
    const format = this.format();
    const series = this.series();
    const empty = this.emptyText();
    return this.categories().map((category, i) => ({
      category,
      cells: series.map((s) => {
        const value = s.data[i];
        return value == null ? empty : format(value);
      }),
    }));
  });
}
