import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ChartPointEvent,
  ChartSeries,
  KC_DEFAULT_PALETTE,
  KcBarChart,
  Orientation,
  ValueFormat,
} from 'kai-charts';
import { PROCEDURES_BY_DAY } from '../sample-data';

interface PlaySeries {
  name: string;
  color: string;
  data: (number | null)[];
}

type FormatKey = 'number' | 'percent' | 'currency' | 'compact';
type LegendMode = 'auto' | 'true' | 'false';

const FORMATS: Record<FormatKey, Intl.NumberFormatOptions> = {
  number: {},
  percent: { style: 'percent', maximumFractionDigits: 0 },
  currency: { style: 'currency', currency: 'VES', maximumFractionDigits: 0 },
  compact: { notation: 'compact' },
};

/**
 * Interactive sandbox: every number and option is editable on the left, the chart on the
 * right reacts live, and the generated template can be copied into a real app.
 */
@Component({
  selector: 'app-playground',
  imports: [KcBarChart],
  templateUrl: './playground.html',
  styleUrl: './playground.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playground {
  // Data
  protected readonly categoriesText = signal(PROCEDURES_BY_DAY.categories.join('\n'));
  protected readonly series = signal<PlaySeries[]>(
    PROCEDURES_BY_DAY.series.map((s) => ({
      name: s.name,
      color: s.color ?? '',
      data: s.data.map((v) => v ?? null),
    })),
  );

  // Options
  protected readonly orientation = signal<Orientation>('vertical');
  protected readonly stacked = signal(false);
  protected readonly showValues = signal(false);
  protected readonly showGrid = signal(true);
  protected readonly showTable = signal(false);
  protected readonly loading = signal(false);
  protected readonly empty = signal(false);
  protected readonly legend = signal<LegendMode>('auto');
  protected readonly height = signal(280);
  protected readonly barRadius = signal(2);
  protected readonly label = signal('Trámites por día de jornada');
  protected readonly locale = signal('es-VE');
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastClick = signal<ChartPointEvent | null>(null);
  protected readonly copied = signal<'json' | 'code' | null>(null);

  protected readonly categories = computed(() =>
    this.categoriesText()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  );

  /** What the chart receives: series aligned to the categories, or no data at all. */
  protected readonly chartSeries = computed<ChartSeries[]>(() => {
    if (this.empty()) return [{ name: 'Serie', data: [] }];
    const categories = this.categories();
    return this.series().map((s) => ({
      name: s.name || 'Serie',
      color: s.color || undefined,
      data: categories.map((_, i) => s.data[i] ?? null),
    }));
  });

  protected readonly valueFormat = computed<ValueFormat>(() => FORMATS[this.format()]);
  protected readonly legendValue = computed<boolean | 'auto'>(() =>
    this.legend() === 'auto' ? 'auto' : this.legend() === 'true',
  );
  protected readonly code = computed(() => this.buildSnippet());

  protected defaultColor(index: number): string {
    return KC_DEFAULT_PALETTE[index % KC_DEFAULT_PALETTE.length];
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onSeriesName(index: number, event: Event): void {
    const name = this.text(event);
    this.series.update((list) => list.map((s, i) => (i === index ? { ...s, name } : s)));
  }

  protected onSeriesColor(index: number, event: Event): void {
    const color = this.text(event);
    this.series.update((list) => list.map((s, i) => (i === index ? { ...s, color } : s)));
  }

  protected addSeries(): void {
    const data = this.categories().map(() => this.random());
    this.series.update((list) => [...list, { name: `Serie ${list.length + 1}`, color: '', data }]);
  }

  protected removeSeries(index: number): void {
    this.series.update((list) => list.filter((_, i) => i !== index));
  }

  protected onCell(seriesIndex: number, categoryIndex: number, event: Event): void {
    const raw = this.text(event).trim();
    const value = raw === '' ? null : Number(raw);
    this.series.update((list) =>
      list.map((s, i) => {
        if (i !== seriesIndex) return s;
        const data = [...s.data];
        while (data.length <= categoryIndex) data.push(null);
        data[categoryIndex] = value === null || Number.isNaN(value) ? null : value;
        return { ...s, data };
      }),
    );
  }

  protected randomize(): void {
    const count = this.categories().length;
    this.series.update((list) =>
      list.map((s) => ({ ...s, data: Array.from({ length: count }, () => this.random()) })),
    );
  }

  protected copyJson(): void {
    const payload = { categories: this.categories(), series: this.chartSeries() };
    this.copy(JSON.stringify(payload, null, 2), 'json');
  }

  protected copyCode(): void {
    this.copy(this.code(), 'code');
  }

  protected onBarClick(event: ChartPointEvent): void {
    this.lastClick.set(event);
  }

  private random(): number {
    return Math.floor(Math.random() * 201);
  }

  private copy(text: string, what: 'json' | 'code'): void {
    void navigator.clipboard?.writeText(text);
    this.copied.set(what);
    setTimeout(() => this.copied.set(null), 1500);
  }

  /** Angular template for the current configuration (defaults omitted). */
  private buildSnippet(): string {
    const attrs = ['[categories]="categories"', '[series]="series"'];
    if (this.orientation() === 'horizontal') attrs.push('orientation="horizontal"');
    if (this.stacked()) attrs.push('stacked');
    if (this.showValues()) attrs.push('showValues');
    if (!this.showGrid()) attrs.push('[showGrid]="false"');
    if (this.showTable()) attrs.push('showTable');
    if (this.legend() !== 'auto') attrs.push(`[showLegend]="${this.legend()}"`);
    if (this.height() !== 280) attrs.push(`height="${this.height()}"`);
    if (this.barRadius() !== 2) attrs.push(`barRadius="${this.barRadius()}"`);
    if (this.label()) attrs.push(`label="${this.label()}"`);
    if (this.locale() !== 'es-VE') attrs.push(`locale="${this.locale()}"`);
    if (this.format() !== 'number')
      attrs.push(`[valueFormat]="${literal(FORMATS[this.format()])}"`);
    if (this.loading()) attrs.push('[loading]="true"');
    attrs.push('(barClick)="onBarClick($event)"');
    return `<kc-bar-chart\n  ${attrs.join('\n  ')}\n/>`;
  }
}

/** `{ style: 'percent', maximumFractionDigits: 0 }` — an object literal valid in a template. */
function literal(options: Intl.NumberFormatOptions): string {
  const entries = Object.entries(options).map(
    ([key, value]) => `${key}: ${typeof value === 'string' ? `'${value}'` : value}`,
  );
  return `{ ${entries.join(', ')} }`;
}
