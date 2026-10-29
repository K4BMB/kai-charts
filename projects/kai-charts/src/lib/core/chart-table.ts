import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartSeries, ValueFormatter } from './types';

/**
 * Mirror table of a chart: the same data as an accessible, printable `<table>`.
 * Rendered by charts when `showTable` is on.
 */
@Component({
  selector: 'kc-chart-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
  `,
  styles: `
    :host {
      display: block;
      margin-top: 12px;
      overflow-x: auto;
    }
    .kc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--kc-font-size, 12px);
    }
    caption {
      margin-bottom: 4px;
      text-align: left;
      font-weight: 600;
      caption-side: top;
    }
    th,
    td {
      padding: 4px 8px;
      border-bottom: 1px solid var(--kc-border, color-mix(in srgb, currentColor 15%, transparent));
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    th:first-child,
    td:first-child {
      text-align: left;
    }
    thead th {
      color: var(--kc-muted, color-mix(in srgb, currentColor 70%, transparent));
      font-weight: 600;
    }
  `,
})
export class KcChartTable {
  readonly categories = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly format = input.required<ValueFormatter>();
  readonly caption = input('');
  readonly categoryHeader = input('');

  protected readonly rows = computed(() => {
    const format = this.format();
    const series = this.series();
    return this.categories().map((category, i) => ({
      category,
      cells: series.map((s) => {
        const value = s.data[i];
        return value == null ? '—' : format(value);
      }),
    }));
  });
}
