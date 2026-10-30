import { useMemo, useState } from 'react';
import { RingChart, type RingItem } from 'kai-charts-react';
import { RINGS } from '../../sample-data';
import { Check, LocaleFormatFields, NumberField, RangeField, TextField } from '../fields';
import { RowsEditor, type RowsColumn } from '../rows-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import {
  constLine,
  defaultColor,
  formatProps,
  jsx,
  resolveFormat,
  snippet,
  type FormatKey,
} from '../shared';

type RingRow = { name: string; value: number | null; max: number | null; color: string };

const COLUMNS: RowsColumn<RingRow>[] = [
  { key: 'name', label: 'Nombre', type: 'text' },
  {
    key: 'value',
    label: 'Valor',
    type: 'number',
    random: () => Math.round(Math.random() * 1000) / 1000,
  },
  { key: 'max', label: 'Máximo', type: 'number', placeholder: '1' },
  { key: 'color', label: 'Color', type: 'color', fallback: defaultColor },
];

const INITIAL_ROWS: RingRow[] = RINGS.map((ring) => ({
  name: ring.name,
  value: ring.value,
  max: ring.max ?? 1,
  color: ring.color ?? '',
}));

const newRow = (rows: readonly RingRow[]): RingRow => ({
  name: `Anillo ${rows.length + 1}`,
  value: Math.round(Math.random() * 1000) / 1000,
  max: 1,
  color: '',
});

/** `max` 1 (or blank) is the component default and is left out of the item. */
const toItems = (rows: readonly RingRow[]): RingItem[] =>
  rows.map((row) => ({
    name: row.name || 'Anillo',
    value: row.value ?? 0,
    max: row.max !== null && row.max !== 1 ? row.max : undefined,
    color: row.color || undefined,
  }));

export function RingSandbox() {
  const [rows, setRows] = useState<RingRow[]>(INITIAL_ROWS);

  const [size, setSize] = useState(200);
  const [thickness, setThickness] = useState(0);
  const [gap, setGap] = useState(4);
  const [centerLabel, setCenterLabel] = useState('Saldo');
  const [centerValue, setCenterValue] = useState<number | null>(0.917);
  const [centerTrend, setCenterTrend] = useState<number | null>(0.038);
  const [invertTrend, setInvertTrend] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [label, setLabel] = useState('Atención nacional');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('percent');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const items = useMemo(() => toItems(rows), [rows]);

  const code = useMemo(() => {
    const props = ['items={items}'];
    if (size !== 200) props.push(`size={${size}}`);
    if (thickness > 0) props.push(`thickness={${thickness}}`);
    if (gap !== 4) props.push(`gap={${gap}}`);
    if (centerLabel) props.push(`centerLabel="${centerLabel}"`);
    if (centerValue !== null) props.push(`centerValue={${centerValue}}`);
    if (centerTrend !== null) props.push(`centerTrend={${centerTrend}}`);
    if (invertTrend) props.push('invertTrend');
    if (!showLegend) props.push('showLegend={false}');
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format, 'percent'));
    if (loading) props.push('loading');
    props.push('onRingClick={onRingClick}');
    return snippet([constLine('items', items)], jsx('RingChart', props));
  }, [
    items,
    size,
    thickness,
    gap,
    centerLabel,
    centerValue,
    centerTrend,
    invertTrend,
    showLegend,
    label,
    locale,
    format,
    loading,
  ]);

  const onRingClick = (item: RingItem) =>
    setLastEvent({
      name: 'onRingClick',
      summary: (
        <>
          <strong>{item.name}</strong> = {item.value}
        </>
      ),
    });

  return (
    <SandboxLayout
      data={
        <RowsEditor
          columns={COLUMNS}
          rows={rows}
          onChange={setRows}
          newRow={newRow}
          json={items}
          label="Anillos"
        />
      }
      options={
        <>
          <RangeField
            label="Tamaño"
            value={size}
            min={120}
            max={320}
            step={10}
            unit="px"
            onChange={setSize}
          />
          <RangeField
            label="Grosor"
            value={thickness}
            min={0}
            max={24}
            unit="px"
            valueText={thickness === 0 ? 'auto' : undefined}
            onChange={setThickness}
          />
          <RangeField label="Separación" value={gap} min={0} max={12} unit="px" onChange={setGap} />
          <TextField label="Texto central" value={centerLabel} onChange={setCenterLabel} />
          <NumberField
            label="Valor central"
            value={centerValue}
            placeholder="ninguno"
            onChange={setCenterValue}
          />
          <NumberField
            label="Tendencia central (razón)"
            value={centerTrend}
            placeholder="ninguna"
            onChange={setCenterTrend}
          />
          <Check label="Tendencia invertida" checked={invertTrend} onChange={setInvertTrend} />
          <Check label="Leyenda" checked={showLegend} onChange={setShowLegend} />
          <Check label="Cargando" checked={loading} onChange={setLoading} />
          <Check label="Sin datos" checked={empty} onChange={setEmpty} />
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
        <RingChart
          items={empty ? [] : items}
          size={size}
          thickness={thickness > 0 ? thickness : undefined}
          gap={gap}
          centerLabel={centerLabel}
          centerValue={centerValue ?? undefined}
          centerTrend={centerTrend ?? undefined}
          invertTrend={invertTrend}
          showLegend={showLegend}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format, 'percent')}
          loading={loading}
          onRingClick={onRingClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita los anillos del panel y el gráfico se actualiza al instante. Clic en un anillo para
          ver <code>onRingClick</code>.
        </>
      }
    />
  );
}
