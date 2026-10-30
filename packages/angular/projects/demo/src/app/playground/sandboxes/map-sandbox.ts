import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  KC_DEFAULT_PALETTE,
  KcVenezuelaMap,
  MapDatum,
  MapMarker,
  MapRegionClickEvent,
  VENEZUELA_STATES,
  seriesColor,
} from 'kai-charts';
import { CITIZENS_MAP } from '../../sample-data';
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

const STATE_OPTIONS = VENEZUELA_STATES.map((s) => ({ value: s.id, label: s.name }));

const STATE_COLUMNS: readonly RowsColumn[] = [
  { key: 'id', header: 'Estado', type: 'select', options: STATE_OPTIONS },
  { key: 'value', header: 'Valor', type: 'number', random: { min: 0, max: 6000 } },
];

const MARKER_COLUMNS: readonly RowsColumn[] = [
  { key: 'label', header: 'Etiqueta', type: 'text' },
  { key: 'lat', header: 'Lat', type: 'number', random: { min: 1.5, max: 12, decimals: 4 } },
  { key: 'lng', header: 'Lng', type: 'number', random: { min: -73, max: -60, decimals: 4 } },
  { key: 'value', header: 'Valor', type: 'number', random: { min: 1, max: 20 } },
];

/**
 * Sandbox of `kc-venezuela-map`: two rows editors (state values and lat/lng markers), every
 * display option, `regionClick` / `markerClick` status.
 */
@Component({
  selector: 'app-map-sandbox',
  imports: [KcVenezuelaMap, RowsEditor, CodeBox, EventStatus, FormatFields],
  templateUrl: './map-sandbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSandbox {
  protected readonly stateColumns = STATE_COLUMNS;
  protected readonly markerColumns = MARKER_COLUMNS;
  protected readonly states = signal<EditorRow[]>(
    CITIZENS_MAP.map((d) => ({ id: d.id, value: d.value ?? null })),
  );
  // Markers (mobile units by lat/lng) start empty so the sandbox opens like the showcase: only the
  // small capital dots. "+ Marcador" adds one; the big pins are an opt-in feature, not a default.
  protected readonly markers = signal<EditorRow[]>([]);

  // Options
  protected readonly color = signal('');
  protected readonly highlight = signal('');
  protected readonly showLegend = signal(true);
  protected readonly showLabels = signal(false);
  protected readonly showCapitals = signal(true);
  protected readonly minOpacity = signal(0.18);
  protected readonly valueHeader = signal('Ciudadanos');
  protected readonly showTable = signal(false);
  protected readonly loading = signal(false);
  protected readonly label = signal('Ciudadanos atendidos por estado');
  protected readonly locale = signal(DEFAULT_LOCALE);
  protected readonly format = signal<FormatKey>('number');

  protected readonly lastEvent = signal<SandboxEvent | null>(null);

  /** The map falls back to the first palette color (`--kc-color-1`). */
  protected readonly defaultColor = seriesColor(0);
  protected readonly defaultSwatch = KC_DEFAULT_PALETTE[0];

  protected readonly data = computed<MapDatum[]>(() =>
    this.states().map((r) => ({ id: cellString(r['id']), value: cellNumber(r['value']) ?? null })),
  );
  protected readonly mapMarkers = computed<MapMarker[]>(() =>
    this.markers().map((r, i) => ({
      id: cellString(r['id']) || `M${i + 1}`,
      lat: cellNumber(r['lat']) ?? 0,
      lng: cellNumber(r['lng']) ?? 0,
      label: cellString(r['label']) || undefined,
      value: cellNumber(r['value']),
    })),
  );
  protected readonly highlightIds = computed(() =>
    this.highlight()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  protected readonly valueFormat = computed(() => valueFormatFor(this.format()));
  protected readonly code = computed(() => this.buildSnippet());

  protected text(event: Event): string {
    return inputValue(event);
  }

  /** "+ Fila" of the states editor: the first state that still has no value. */
  protected newState = (): EditorRow => {
    const used = new Set(this.states().map((r) => cellString(r['id'])));
    const next = VENEZUELA_STATES.find((s) => !used.has(s.id)) ?? VENEZUELA_STATES[0];
    return { id: next.id, value: 800 + Math.round(Math.random() * 2200) };
  };

  /** "+ Fila" of the markers editor: a unit near the centre of the country. */
  protected newMarker = (index: number): EditorRow => ({
    id: `UM-${index + 1}`,
    label: `Unidad ${index + 1}`,
    lat: 8,
    lng: -66,
    value: 1,
  });

  protected onRegionClick(event: MapRegionClickEvent): void {
    this.lastEvent.set({
      name: 'regionClick',
      summary: `${event.name} = ${event.value ?? '—'}`,
    });
  }

  protected onMarkerClick(marker: MapMarker): void {
    this.lastEvent.set({ name: 'markerClick', summary: marker.label ?? marker.id });
  }

  private buildSnippet(): string {
    const attrs = ['[data]="data"'];
    if (this.mapMarkers().length > 0) attrs.push('[markers]="markers"');
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
    if (this.minOpacity() !== 0.18) attrs.push(attr('minOpacity', String(this.minOpacity())));
    if (this.valueHeader() !== 'Valor') attrs.push(attr('valueHeader', this.valueHeader()));
    if (this.showTable()) attrs.push('showTable');
    if (this.label()) attrs.push(attr('label', this.label()));
    if (this.locale() !== DEFAULT_LOCALE) attrs.push(attr('locale', this.locale()));
    if (this.format() !== 'number')
      attrs.push(bind('valueFormat', formatLiteral(FORMATS[this.format()])));
    if (this.loading()) attrs.push(bind('loading', true));
    attrs.push('(regionClick)="onRegionClick($event)"', '(markerClick)="onMarkerClick($event)"');
    const parts = [
      element('kc-venezuela-map', attrs),
      '',
      tsConst('data', 'MapDatum', this.data()),
    ];
    if (this.mapMarkers().length > 0) {
      parts.push('', tsConst('markers', 'MapMarker', this.mapMarkers()));
    }
    return parts.join('\n');
  }
}
