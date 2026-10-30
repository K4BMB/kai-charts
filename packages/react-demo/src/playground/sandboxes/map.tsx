import { useMemo, useState } from 'react';
import {
  VENEZUELA_STATES,
  VenezuelaMap,
  type MapDatum,
  type MapMarker,
  type MapRegionClickEvent,
} from 'kai-charts-react';
import { CITIZENS_MAP, MOBILE_UNITS } from '../../sample-data';
import { Check, ColorField, LocaleFormatFields, RangeField, TextField } from '../fields';
import { RowsEditor, type RowsColumn } from '../rows-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import {
  constLine,
  defaultColor,
  formatProps,
  jsx,
  literal,
  randomInt,
  resolveFormat,
  snippet,
  type FormatKey,
} from '../shared';

type StateRow = { id: string; value: number | null };
type MarkerRow = {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  value: number | null;
};

const STATE_OPTIONS = VENEZUELA_STATES.map((state) => ({ value: state.id, label: state.name }));

const STATE_COLUMNS: RowsColumn<StateRow>[] = [
  { key: 'id', label: 'Estado', type: 'select', options: STATE_OPTIONS },
  { key: 'value', label: 'Valor', type: 'number', random: () => randomInt(500, 6000) },
];
const MARKER_COLUMNS: RowsColumn<MarkerRow>[] = [
  { key: 'label', label: 'Etiqueta', type: 'text' },
  { key: 'lat', label: 'Latitud', type: 'number' },
  { key: 'lng', label: 'Longitud', type: 'number' },
  { key: 'value', label: 'Valor', type: 'number', random: () => randomInt(1, 20) },
];

const INITIAL_STATES: StateRow[] = CITIZENS_MAP.map((d) => ({ id: d.id, value: d.value ?? null }));
const INITIAL_MARKERS: MarkerRow[] = MOBILE_UNITS.map((m) => ({
  id: m.id,
  label: m.label ?? '',
  lat: m.lat,
  lng: m.lng,
  value: m.value ?? null,
}));

/** Next state without data (or the first one), with a random value. */
const newStateRow = (rows: readonly StateRow[]): StateRow => {
  const missing = VENEZUELA_STATES.find((state) => !rows.some((row) => row.id === state.id));
  return { id: (missing ?? VENEZUELA_STATES[0]).id, value: randomInt(500, 6000) };
};
/** A new unit in Caracas; the user moves it by editing lat/lng. */
const newMarkerRow = (rows: readonly MarkerRow[]): MarkerRow => ({
  id: `UM-${rows.length + 1}`,
  label: `Unidad ${rows.length + 1}`,
  lat: 10.4806,
  lng: -66.9036,
  value: randomInt(1, 20),
});

const toData = (rows: readonly StateRow[]): MapDatum[] =>
  rows.map((row) => ({ id: row.id, value: row.value }));
/** Markers without coordinates cannot be projected and are skipped. */
const toMarkers = (rows: readonly MarkerRow[]): MapMarker[] =>
  rows
    .filter((row) => row.lat !== null && row.lng !== null)
    .map((row) => ({
      id: row.id,
      lat: row.lat as number,
      lng: row.lng as number,
      label: row.label || undefined,
      value: row.value ?? undefined,
    }));

export function MapSandbox() {
  const [states, setStates] = useState<StateRow[]>(INITIAL_STATES);
  const [markerRows, setMarkerRows] = useState<MarkerRow[]>(INITIAL_MARKERS);

  const [color, setColor] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [showLegend, setShowLegend] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showClaimZone, setShowClaimZone] = useState(true);
  const [showCapitals, setShowCapitals] = useState(true);
  const [minOpacity, setMinOpacity] = useState(0.18);
  const [valueHeader, setValueHeader] = useState('Ciudadanos');
  const [label, setLabel] = useState('Ciudadanos atendidos por estado');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const data = useMemo(() => toData(states), [states]);
  const markers = useMemo(() => toMarkers(markerRows), [markerRows]);
  const highlight = useMemo(
    () =>
      highlightText
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    [highlightText],
  );

  const code = useMemo(() => {
    const props = ['data={data}'];
    const consts = [constLine('data', data)];
    if (markers.length > 0) {
      consts.push(constLine('markers', markers));
      props.push('markers={markers}');
    }
    if (color) props.push(`color="${color}"`);
    if (highlight.length === 1) props.push(`highlight="${highlight[0]}"`);
    if (highlight.length > 1) props.push(`highlight={${literal(highlight)}}`);
    if (!showLegend) props.push('showLegend={false}');
    if (showLabels) props.push('showLabels');
    if (!showClaimZone) props.push('showClaimZone={false}');
    if (!showCapitals) props.push('showCapitals={false}');
    if (minOpacity !== 0.18) props.push(`minOpacity={${minOpacity}}`);
    if (valueHeader !== 'Valor') props.push(`valueHeader="${valueHeader}"`);
    if (showTable) props.push('showTable');
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onRegionClick={onRegionClick}', 'onMarkerClick={onMarkerClick}');
    return snippet(consts, jsx('VenezuelaMap', props));
  }, [
    data,
    markers,
    color,
    highlight,
    showLegend,
    showLabels,
    showClaimZone,
    showCapitals,
    minOpacity,
    valueHeader,
    showTable,
    label,
    locale,
    format,
    loading,
  ]);

  const onRegionClick = (e: MapRegionClickEvent) =>
    setLastEvent({
      name: 'onRegionClick',
      summary: (
        <>
          <strong>{e.name}</strong> = {e.value ?? '—'}
        </>
      ),
    });
  const onMarkerClick = (marker: MapMarker) =>
    setLastEvent({ name: 'onMarkerClick', summary: <strong>{marker.label ?? marker.id}</strong> });

  return (
    <SandboxLayout
      data={
        <>
          <RowsEditor
            title="Estados"
            columns={STATE_COLUMNS}
            rows={states}
            onChange={setStates}
            newRow={newStateRow}
            json={data}
            label="Valores por estado"
          />
          <RowsEditor
            title="Marcadores"
            columns={MARKER_COLUMNS}
            rows={markerRows}
            onChange={setMarkerRows}
            newRow={newMarkerRow}
            json={markers}
            label="Marcadores"
          />
        </>
      }
      options={
        <>
          <ColorField label="Color" value={color} fallback={defaultColor(0)} onChange={setColor} />
          <TextField
            label="Resaltar (highlight)"
            value={highlightText}
            placeholder="VE-V, Miranda"
            onChange={setHighlightText}
          />
          <Check label="Leyenda" checked={showLegend} onChange={setShowLegend} />
          <Check label="Nombres" checked={showLabels} onChange={setShowLabels} />
          <Check label="Zona en Reclamación" checked={showClaimZone} onChange={setShowClaimZone} />
          <Check label="Capitales" checked={showCapitals} onChange={setShowCapitals} />
          <Check label="Tabla espejo" checked={showTable} onChange={setShowTable} />
          <Check label="Cargando" checked={loading} onChange={setLoading} />
          <RangeField
            label="Opacidad mínima"
            value={minOpacity}
            min={0}
            max={0.6}
            step={0.02}
            onChange={setMinOpacity}
          />
          <TextField label="Nombre del valor" value={valueHeader} onChange={setValueHeader} />
          <TextField label="Etiqueta accesible (label)" value={label} onChange={setLabel} wide />
          <LocaleFormatFields
            locale={locale}
            onLocale={setLocale}
            format={format}
            onFormat={setFormat}
          />
        </>
      }
      code={code}
      chart={
        <VenezuelaMap
          data={data}
          markers={markers}
          color={color || undefined}
          highlight={highlight}
          showLegend={showLegend}
          showLabels={showLabels}
          showClaimZone={showClaimZone}
          showCapitals={showCapitals}
          minOpacity={minOpacity}
          valueHeader={valueHeader}
          showTable={showTable}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format)}
          loading={loading}
          onRegionClick={onRegionClick}
          onMarkerClick={onMarkerClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita los estados y marcadores del panel y el mapa se actualiza al instante. Clic en un
          estado para ver <code>onRegionClick</code>; en un marcador, <code>onMarkerClick</code>.
        </>
      }
    />
  );
}
