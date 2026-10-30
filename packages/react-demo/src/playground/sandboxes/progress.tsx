import { useMemo, useState } from 'react';
import { ProgressList, type ProgressItem, type Tone } from 'kai-charts-react';
import { DENSITY } from '../../sample-data';
import { Check, LocaleFormatFields, NumberField, TextField } from '../fields';
import { RowsEditor, type RowsColumn } from '../rows-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import { constLine, formatProps, jsx, resolveFormat, snippet, type FormatKey } from '../shared';

type ProgressRow = { label: string; value: number | null; tone: string; caption: string };

const TONES = [
  { value: 'neutral', label: 'neutral' },
  { value: 'success', label: 'success' },
  { value: 'warning', label: 'warning' },
  { value: 'danger', label: 'danger' },
  { value: 'info', label: 'info' },
];

const COLUMNS: RowsColumn<ProgressRow>[] = [
  { key: 'label', label: 'Etiqueta', type: 'text' },
  {
    key: 'value',
    label: 'Valor',
    type: 'number',
    random: () => Math.round(Math.random() * 250) / 10,
  },
  { key: 'tone', label: 'Tono', type: 'select', options: TONES },
  { key: 'caption', label: 'Nota', type: 'text' },
];

const INITIAL_ROWS: ProgressRow[] = DENSITY.map((item) => ({
  label: item.label,
  value: item.value,
  tone: item.tone ?? 'neutral',
  caption: item.caption ?? '',
}));

const newRow = (rows: readonly ProgressRow[]): ProgressRow => ({
  label: `Región ${rows.length + 1}`,
  value: Math.round(Math.random() * 250) / 10,
  tone: 'neutral',
  caption: '',
});

/** `neutral` is the component default tone and is left out of the item. */
const toItems = (rows: readonly ProgressRow[]): ProgressItem[] =>
  rows.map((row) => ({
    label: row.label || 'Fila',
    value: row.value ?? 0,
    tone: row.tone === 'neutral' ? undefined : (row.tone as Tone),
    caption: row.caption || undefined,
  }));

export function ProgressSandbox() {
  const [rows, setRows] = useState<ProgressRow[]>(INITIAL_ROWS);

  const [max, setMax] = useState<number | null>(null);
  const [showValues, setShowValues] = useState(true);
  const [label, setLabel] = useState('Densidad de atención por región');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const items = useMemo(() => toItems(rows), [rows]);

  const code = useMemo(() => {
    const props = ['items={items}'];
    if (max !== null) props.push(`max={${max}}`);
    if (!showValues) props.push('showValues={false}');
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onItemClick={onItemClick}');
    return snippet([constLine('items', items)], jsx('ProgressList', props));
  }, [items, max, showValues, label, locale, format, loading]);

  const onItemClick = (item: ProgressItem) =>
    setLastEvent({
      name: 'onItemClick',
      summary: (
        <>
          <strong>{item.label}</strong> = {item.value}
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
          label="Filas de progreso"
        />
      }
      options={
        <>
          <NumberField label="Máximo (max)" value={max} placeholder="auto" onChange={setMax} />
          <Check label="Valores" checked={showValues} onChange={setShowValues} />
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
        <ProgressList
          items={empty ? [] : items}
          max={max ?? undefined}
          showValues={showValues}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format)}
          loading={loading}
          onItemClick={onItemClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita las filas del panel y la lista se actualiza al instante. Clic en una fila para ver{' '}
          <code>onItemClick</code>.
        </>
      }
    />
  );
}
