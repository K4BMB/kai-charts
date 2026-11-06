import { useEffect, useMemo, useState } from 'react';
import {
  STATE_MAPS,
  StateMap,
  loadStateMap,
  type MapDatum,
  type MapRegionClickEvent,
  type RegionMapGeometry,
} from 'kai-charts-react';
import {
  Check,
  ColorField,
  LocaleFormatFields,
  RangeField,
  SelectField,
  TextField,
} from '../fields';
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

type MunicipalityRow = { id: string; value: number | null };

const STATE_OPTIONS = STATE_MAPS.map((state) => ({ value: state.id, label: state.name }));

/** The first 5 municipalities of a state with random values 300–2.800. */
const initialRows = (geometry: RegionMapGeometry): MunicipalityRow[] =>
  geometry.regions.slice(0, 5).map((region) => ({ id: region.id, value: randomInt(300, 2800) }));

const toData = (rows: readonly MunicipalityRow[]): MapDatum[] =>
  rows.map((row) => ({ id: row.id, value: row.value }));

/**
 * Sandbox of `<StateMap />`: a state picker, a rows editor of municipality values (rebuilt from
 * the loaded geometry when the state changes), every display option, `onRegionClick` status
 * with the INE code.
 */
export function StateSandbox() {
  const [state, setState] = useState('VE-V');
  // Loaded here too (the core caches the chunk) so the editor can list the municipalities.
  const [geometry, setGeometry] = useState<RegionMapGeometry | null>(null);
  const [rows, setRows] = useState<MunicipalityRow[]>([]);

  const [color, setColor] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [showLegend, setShowLegend] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showCapitals, setShowCapitals] = useState(true);
  const [showSeats, setShowSeats] = useState(false);
  const [minOpacity, setMinOpacity] = useState(0.18);
  const [valueHeader, setValueHeader] = useState('Ciudadanos');
  const [label, setLabel] = useState('Ciudadanos atendidos por municipio');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  useEffect(() => {
    let stale = false;
    setGeometry(null);
    setRows([]);
    loadStateMap(state).then((result) => {
      if (stale) return;
      setGeometry(result);
      setRows(initialRows(result));
    });
    return () => {
      stale = true;
    };
  }, [state]);

  const columns = useMemo<RowsColumn<MunicipalityRow>[]>(
    () => [
      {
        key: 'id',
        label: 'Municipio',
        type: 'select',
        options: (geometry?.regions ?? []).map((region) => ({
          value: region.id,
          label: region.name,
        })),
      },
      { key: 'value', label: 'Valor', type: 'number', random: () => randomInt(300, 2800) },
    ],
    [geometry],
  );
  /** "+ Fila": the first municipality that still has no value. */
  const newRow = (current: readonly MunicipalityRow[]): MunicipalityRow => {
    const regions = geometry?.regions ?? [];
    const missing = regions.find((region) => !current.some((row) => row.id === region.id));
    return { id: (missing ?? regions[0])?.id ?? '', value: randomInt(300, 2800) };
  };

  const data = useMemo(() => toData(rows), [rows]);
  const highlight = useMemo(
    () =>
      highlightText
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    [highlightText],
  );

  const code = useMemo(() => {
    const props = [`state="${state}"`, 'data={data}'];
    const consts = [constLine('data', data)];
    if (color) props.push(`color="${color}"`);
    if (highlight.length === 1) props.push(`highlight="${highlight[0]}"`);
    if (highlight.length > 1) props.push(`highlight={${literal(highlight)}}`);
    if (!showLegend) props.push('showLegend={false}');
    if (showLabels) props.push('showLabels');
    if (!showCapitals) props.push('showCapitals={false}');
    if (showSeats) props.push('showSeats');
    if (minOpacity !== 0.18) props.push(`minOpacity={${minOpacity}}`);
    if (valueHeader !== 'Valor') props.push(`valueHeader="${valueHeader}"`);
    if (showTable) props.push('showTable');
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onRegionClick={onRegionClick}');
    return snippet(consts, jsx('StateMap', props));
  }, [
    state,
    data,
    color,
    highlight,
    showLegend,
    showLabels,
    showCapitals,
    showSeats,
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
          <strong>{e.name}</strong>
          {e.code ? ` (${e.code})` : ''} = {e.value ?? '—'}
        </>
      ),
    });

  return (
    <SandboxLayout
      data={
        <>
          <SelectField
            label="Estado (state)"
            value={state}
            options={STATE_OPTIONS}
            onChange={setState}
          />
          <RowsEditor
            title="Municipios"
            columns={columns}
            rows={rows}
            onChange={setRows}
            newRow={newRow}
            json={data}
            label="Valores por municipio"
          />
        </>
      }
      options={
        <>
          <ColorField label="Color" value={color} fallback={defaultColor(0)} onChange={setColor} />
          <TextField
            label="Resaltar (highlight)"
            value={highlightText}
            placeholder="Maracaibo, cabimas"
            onChange={setHighlightText}
          />
          <Check label="Leyenda" checked={showLegend} onChange={setShowLegend} />
          <Check label="Nombres" checked={showLabels} onChange={setShowLabels} />
          <Check label="Capital del estado" checked={showCapitals} onChange={setShowCapitals} />
          <Check label="Capitales de municipio" checked={showSeats} onChange={setShowSeats} />
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
        <StateMap
          state={state}
          geometry={geometry ?? undefined}
          data={data}
          color={color || undefined}
          highlight={highlight}
          showLegend={showLegend}
          showLabels={showLabels}
          showCapitals={showCapitals}
          showSeats={showSeats}
          minOpacity={minOpacity}
          valueHeader={valueHeader}
          showTable={showTable}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format)}
          loading={loading}
          onRegionClick={onRegionClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Elige un estado y edita sus municipios; el mapa se actualiza al instante. Clic en un
          municipio para ver <code>onRegionClick</code> con su código INE.
        </>
      }
    />
  );
}
