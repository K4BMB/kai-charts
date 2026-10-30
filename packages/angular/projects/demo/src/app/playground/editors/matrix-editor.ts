import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { ChartSeries, KC_DEFAULT_PALETTE } from 'kai-charts';
import { copyToClipboard } from './clipboard';
import { isIncompleteNumber } from './dom';

/** One editable series: an empty color means "palette color for its index". */
export interface PlaySeries {
  name: string;
  color: string;
  data: (number | null)[];
}

/** Splits the raw textarea text into trimmed, non-empty category names. */
export function parseCategories(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Editable copy of sample series (colors and gaps normalised). */
export function toPlaySeries(series: readonly ChartSeries[]): PlaySeries[] {
  return series.map((s) => ({
    name: s.name,
    color: s.color ?? '',
    data: s.data.map((v) => v ?? null),
  }));
}

/** What a bar/line chart receives: series aligned to the categories, defaults omitted. */
export function toChartSeries(series: readonly PlaySeries[], categories: string[]): ChartSeries[] {
  return series.map((s) => ({
    name: s.name || 'Serie',
    color: s.color || undefined,
    data: categories.map((_, i) => s.data[i] ?? null),
  }));
}

/**
 * Categories × series editor of the bar and line sandboxes: a textarea with one category per
 * line, the list of series (name, color, Quitar, "+ Serie") and the table of values
 * (`input type=number`, empty = gap). "Aleatorio" re-rolls 0–200; "Copiar JSON" copies `json`.
 */
@Component({
  selector: 'app-matrix-editor',
  templateUrl: './matrix-editor.html',
  styleUrl: './matrix-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatrixEditor {
  /** Raw textarea text; kept as typed so the caret never jumps. */
  readonly categoriesText = model.required<string>();
  readonly series = model.required<PlaySeries[]>();
  /** Payload of "Copiar JSON" (`{ categories, series }` as the chart receives them). */
  readonly json = input<unknown>(undefined);

  protected readonly copied = signal(false);
  protected readonly categories = computed(() => parseCategories(this.categoriesText()));

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
    if (isIncompleteNumber(event)) return;
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
    const payload = this.json() ?? { categories: this.categories(), series: this.series() };
    copyToClipboard(JSON.stringify(payload, null, 2));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  private random(): number {
    return Math.floor(Math.random() * 201);
  }
}
