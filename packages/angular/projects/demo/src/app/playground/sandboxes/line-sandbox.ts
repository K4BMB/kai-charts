import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ChartPointEvent, ChartSeries, CurveType, KcLineChart } from 'kai-charts';
import { LINE_SAMPLE } from '../../sample-data';
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

/** Sandbox of `kc-line-chart`: same matrix editor as the bars, line-specific options, `pointClick`. */
@Component({
  selector: 'app-line-sandbox',
  imports: [KcLineChart, MatrixEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './line-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineSandbox {
  // Data
  protected readonly categoriesText = signal(LINE_SAMPLE.categories.join('\n'));
  protected readonly series = signal<PlaySeries[]>(toPlaySeries(LINE_SAMPLE.series));

  // Options
  protected readonly curve = signal<CurveType>('smooth');
  protected readonly area = signal(false);
  protected readonly includeZero = signal(true);
  protected readonly showEndValues = signal(false);
  protected readonly showGrid = signal(true);
  protected readonly showValueAxis = signal(true);
  protected readonly showCategoryAxis = signal(true);
  protected readonly legend = signal<LegendMode>('auto');
  protected readonly height = signal(280);
  protected readonly pointRadius = signal(3);
  protected readonly showTable = signal(false);
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly label = signal('Ciudadanos atendidos por jornada');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  protected readonly categories = computed(() => parseCategories(this.categoriesText()));
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

  protected onPointClick(event: ChartPointEvent): void {
    this.lastEvent.set({
      name: 'pointClick',
      summary: `${event.category} · ${event.series} = ${event.value}`,
    });
  }

  private buildSnippet(): string {
    const attrs = ['[categories]="categories"', '[series]="series"'];
    if (this.curve() !== 'smooth') attrs.push(attr('curve', this.curve()));
    if (this.area()) attrs.push('area');
    if (!this.includeZero()) attrs.push(bind('includeZero', false));
    if (this.showEndValues()) attrs.push('showEndValues');
    if (!this.showGrid()) attrs.push(bind('showGrid', false));
    if (!this.showValueAxis()) attrs.push(bind('showValueAxis', false));
    if (!this.showCategoryAxis()) attrs.push(bind('showCategoryAxis', false));
    if (this.legend() !== 'auto') attrs.push(bind('showLegend', this.legend()));
    if (this.height() !== 280) attrs.push(attr('height', String(this.height())));
    if (this.pointRadius() !== 3) attrs.push(attr('pointRadius', String(this.pointRadius())));
    if (this.showTable()) attrs.push('showTable');
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(pointClick)="onPointClick($event)"');
    return [
      element('kc-line-chart', attrs),
      '',
      `const categories = ${tsLiteral(this.categories())};`,
      tsConst('series', 'ChartSeries', toChartSeries(this.series(), this.categories())),
    ].join('\n');
  }
}
