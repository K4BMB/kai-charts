import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KC_DEFAULT_PALETTE,
  KcStateMap,
  MapDatum,
  MapRegionClickEvent,
  RegionMapGeometry,
  STATE_MAPS,
  loadStateMap,
  seriesColor,
} from 'kai-charts';
import { CodeBox } from '../editors/code-box';
import { inputValue } from '../editors/dom';
import { EventStatus, SandboxEvent } from '../editors/event-status';
import { FormatFields } from '../editors/format-fields';
import {
  DEFAULT_LOCALE,
  FORMATS,
  FormatKey,
  formatLiteral,
  valueFormatFor,
} from '../editors/formats';
import { EditorRow, RowsColumn, RowsEditor, cellNumber, cellString } from '../editors/rows-editor';
import { attr, bind, element, tsConst } from '../editors/snippet';

const STATE_OPTIONS = STATE_MAPS.map((s) => ({ value: s.id, label: s.name }));

/**
 * Sandbox of `kc-state-map`: a state picker, a rows editor of municipality values (rebuilt from
 * the loaded geometry when the state changes), every display option, `regionClick` status with
 * the INE code.
 */
@Component({
  selector: 'app-state-sandbox',
  imports: [KcStateMap, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './state-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateSandbox {
  protected readonly stateOptions = STATE_OPTIONS;
  protected readonly state = signal('VE-V');
  /** Geometry of the chosen state (loaded here so the editor can list its municipalities). */
  protected readonly geometry = signal<RegionMapGeometry | null>(null);
  protected readonly rows = signal<EditorRow[]>([]);
  private request = 0;

  // Options
  protected readonly color = signal('');
  protected readonly highlight = signal('');
  protected readonly showLegend = signal(true);
  protected readonly showLabels = signal(false);
  protected readonly showCapitals = signal(true);
  protected readonly showSeats = signal(false);
  protected readonly minOpacity = signal(0.18);
  protected readonly valueHeader = signal('Ciudadanos');
  protected readonly showTable = signal(false);
  protected readonly loading = signal(false);
  protected readonly label = signal('Ciudadanos atendidos por municipio');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  /** The map falls back to the first palette color (`--kc-color-1`). */
  protected readonly defaultColor = seriesColor(0);
  protected readonly defaultSwatch = KC_DEFAULT_PALETTE[0];

  /** Municipality column: a select of the loaded geometry's regions by name (value = id). */
  protected readonly columns = computed<readonly RowsColumn[]>(() => [
    {
      key: 'id',
      header: 'Municipio',
      type: 'select',
      options: (this.geometry()?.regions ?? []).map((r) => ({ value: r.id, label: r.name })),
    },
    { key: 'value', header: 'Valor', type: 'number', random: { min: 300, max: 2800 } },
  ]);

  protected readonly data = computed<MapDatum[]>(() =>
    this.rows().map((r) => ({ id: cellString(r['id']), value: cellNumber(r['value']) ?? null })),
  );
  protected readonly highlightIds = computed(() =>
    this.highlight()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly code = computed(() => this.buildSnippet());

  constructor() {
    this.selectState(this.state());
  }

  protected text(event: Event): string {
    return inputValue(event);
  }

  /** Loads the state's chunk and prefills the editor with its first 5 municipalities. */
  protected selectState(id: string): void {
    this.state.set(id);
    this.geometry.set(null);
    this.rows.set([]);
    const request = ++this.request;
    loadStateMap(id).then((geometry) => {
      if (request !== this.request) return;
      this.geometry.set(geometry);
      this.rows.set(
        geometry.regions.slice(0, 5).map((region) => ({
          id: region.id,
          value: 300 + Math.round(Math.random() * 2500),
        })),
      );
    });
  }

  /** "+ Municipio": the first municipality that still has no value. */
  protected newRow = (): EditorRow => {
    const regions = this.geometry()?.regions ?? [];
    const used = new Set(this.rows().map((r) => cellString(r['id'])));
    const next = regions.find((r) => !used.has(r.id)) ?? regions[0];
    return { id: next?.id ?? '', value: 300 + Math.round(Math.random() * 2500) };
  };

  protected onRegionClick(event: MapRegionClickEvent): void {
    this.lastEvent.set({
      name: 'regionClick',
      summary: `${event.name}${event.code ? ` (${event.code})` : ''} = ${event.value ?? '—'}`,
    });
  }

  private buildSnippet(): string {
    const attrs = [attr('state', this.state()), '[data]="data"'];
    if (this.color()) attrs.push(attr('color', this.color()));
    if (this.highlightIds().length > 0)
      attrs.push(
        bind(
          'highlight',
          `[${this.highlightIds()
            .map((id) => `'${id}'`)
            .join(', ')}]`,
        ),
      );
    if (!this.showLegend()) attrs.push(bind('showLegend', false));
    if (this.showLabels()) attrs.push('showLabels');
    if (!this.showCapitals()) attrs.push(bind('showCapitals', false));
    if (this.showSeats()) attrs.push('showSeats');
    if (this.minOpacity() !== 0.18) attrs.push(attr('minOpacity', String(this.minOpacity())));
    if (this.valueHeader() !== 'Valor') attrs.push(attr('valueHeader', this.valueHeader()));
    if (this.showTable()) attrs.push('showTable');
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(regionClick)="onRegionClick($event)"');
    return [element('kc-state-map', attrs), '', tsConst('data', 'MapDatum', this.data())].join(
      '\n',
    );
  }
}
