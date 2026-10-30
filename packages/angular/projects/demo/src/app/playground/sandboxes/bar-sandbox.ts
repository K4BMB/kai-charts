import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ChartPointEvent, ChartSeries, KcBarChart, Orientation } from 'kai-charts';
import { PROCEDURES_BY_DAY } from '../../sample-data';
import { CodeBox } from '../editors/code-box';
import { inputValue } from '../editors/dom';
import { EventStatus, SandboxEvent } from '../editors/event-status';
import { FormatFields } from '../editors/format-fields';
import {
  DEFAULT_LOCALE,
  FORMATS,
  FormatKey,
  LegendMode,
  formatLiteral,
  legendValue,
  valueFormatFor,
} from '../editors/formats';
import {
  MatrixEditor,
  PlaySeries,
  parseCategories,
  toChartSeries,
  toPlaySeries,
} from '../editors/matrix-editor';
import { attr, bind, element, tsConst, tsLiteral } from '../editors/snippet';

/** Sandbox of `kc-bar-chart`: categories × series matrix, every input, `barClick` status. */
@Component({
  selector: 'app-bar-sandbox',
  imports: [KcBarChart, MatrixEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './bar-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarSandbox {
  // Data
  protected readonly categoriesText = signal(PROCEDURES_BY_DAY.categories.join('\n'));
  protected readonly series = signal<PlaySeries[]>(toPlaySeries(PROCEDURES_BY_DAY.series));

  // Options
  protected readonly orientation = signal<Orientation>('vertical');
  protected readonly stacked = signal(false);
  protected readonly showValues = signal(false);
  protected readonly showGrid = signal(true);
  protected readonly showValueAxis = signal(true);
  protected readonly showCategoryAxis = signal(true);
  protected readonly roundStackTop = signal(false);
  protected readonly barWidth = signal(0.7);
  protected readonly showTable = signal(false);
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly legend = signal<LegendMode>('auto');
  protected readonly height = signal(280);
  protected readonly barRadius = signal(2);
  protected readonly label = signal('Trámites por día de jornada');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly categories = computed(() => parseCategories(this.categoriesText()));
  /** What the chart receives: series aligned to the categories, or no data at all. */
  protected readonly chartSeries = computed<ChartSeries[]>(() =>
    this.empty() ? [{ name: 'Serie', data: [] }] : toChartSeries(this.series(), this.categories()),
  );
  protected readonly json = computed(() => ({
    categories: this.categories(),
    series: this.chartSeries(),
  }));
  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly legendValue = computed(() => legendValue(this.legend()));
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  protected onBarClick(event: ChartPointEvent): void {
    this.lastEvent.set({
      name: 'barClick',
      summary: `${event.category} · ${event.series} = ${event.value}`,
    });
  }

  /** Angular template for the current configuration (defaults omitted) + the data constants. */
  private buildSnippet(): string {
    const attrs = ['[categories]="categories"', '[series]="series"'];
    if (this.orientation() === 'horizontal') attrs.push('orientation="horizontal"');
    if (this.stacked()) attrs.push('stacked');
    if (this.showValues()) attrs.push('showValues');
    if (!this.showGrid()) attrs.push(bind('showGrid', false));
    if (!this.showValueAxis()) attrs.push(bind('showValueAxis', false));
    if (!this.showCategoryAxis()) attrs.push(bind('showCategoryAxis', false));
    if (this.roundStackTop()) attrs.push('roundStackTop');
    if (this.barWidth() !== 0.7) attrs.push(attr('barWidth', String(this.barWidth())));
    if (this.showTable()) attrs.push('showTable');
    if (this.legend() !== 'auto') attrs.push(bind('showLegend', this.legend()));
    if (this.height() !== 280) attrs.push(attr('height', String(this.height())));
    if (this.barRadius() !== 2) attrs.push(attr('barRadius', String(this.barRadius())));
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(barClick)="onBarClick($event)"');
    return [
      element('kc-bar-chart', attrs),
      '',
      `const categories = ${tsLiteral(this.categories())};`,
      tsConst('series', 'ChartSeries', toChartSeries(this.series(), this.categories())),
    ].join('\n');
  }
}
