import { useMemo, useState } from 'react';
import { RankingList, type RankingItem, type RankingSort } from 'kai-charts-react';
import { CITIZENS_BY_STATE } from '../../sample-data';
import { Check, LocaleFormatFields, NumberField, SelectField, TextField } from '../fields';
import { RowsEditor, type RowsColumn } from '../rows-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import {
  constLine,
  defaultColor,
  formatProps,
  jsx,
  randomInt,
  resolveFormat,
  snippet,
  type FormatKey,
} from '../shared';

type RankingRow = {
  id?: string;
  label: string;
  sublabel: string;
  value: number | null;
  color: string;
};

const SORTS = [
  { value: 'desc', label: 'Descendente' },
  { value: 'asc', label: 'Ascendente' },
  { value: 'none', label: 'Sin ordenar' },
] as const;

const COLUMNS: RowsColumn<RankingRow>[] = [
  { key: 'label', label: 'Etiqueta', type: 'text' },
  { key: 'sublabel', label: 'Subetiqueta', type: 'text' },
  { key: 'value', label: 'Valor', type: 'number', random: () => randomInt(500, 6000) },
  { key: 'color', label: 'Color', type: 'color', fallback: () => defaultColor(0) },
];

const INITIAL_ROWS: RankingRow[] = CITIZENS_BY_STATE.map((item) => ({
  id: item.id,
  label: item.label,
  sublabel: item.sublabel ?? '',
  value: item.value,
  color: item.color ?? '',
}));

const newRow = (rows: readonly RankingRow[]): RankingRow => ({
  label: `Estado ${rows.length + 1}`,
  sublabel: '',
  value: randomInt(500, 6000),
  color: '',
});

const toItems = (rows: readonly RankingRow[]): RankingItem[] =>
  rows.map((row) => ({
    id: row.id,
    label: row.label || 'Fila',
    sublabel: row.sublabel || undefined,
    value: row.value ?? 0,
    color: row.color || undefined,
  }));

export function RankingSandbox() {
  const [rows, setRows] = useState<RankingRow[]>(INITIAL_ROWS);

  const [limit, setLimit] = useState<number | null>(null);
  const [sort, setSort] = useState<RankingSort>('desc');
  const [showBars, setShowBars] = useState(true);
  const [showRank, setShowRank] = useState(true);
  const [label, setLabel] = useState('Ciudadanos atendidos por estado');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const items = useMemo(() => toItems(rows), [rows]);

  const code = useMemo(() => {
    const props = ['items={items}'];
    if (limit !== null) props.push(`limit={${limit}}`);
    if (sort !== 'desc') props.push(`sort="${sort}"`);
    if (!showBars) props.push('showBars={false}');
    if (!showRank) props.push('showRank={false}');
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onItemClick={onItemClick}');
    return snippet([constLine('items', items)], jsx('RankingList', props));
  }, [items, limit, sort, showBars, showRank, label, locale, format, loading]);

  const onItemClick = (item: RankingItem) =>
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
          label="Filas del ranking"
        />
      }
      options={
        <>
          <NumberField
            label="Límite (limit)"
            value={limit}
            placeholder="todas"
            step={1}
            min={1}
            onChange={setLimit}
          />
          <SelectField label="Orden (sort)" value={sort} options={SORTS} onChange={setSort} />
          <Check label="Barras" checked={showBars} onChange={setShowBars} />
          <Check label="Posición" checked={showRank} onChange={setShowRank} />
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
        <RankingList
          items={empty ? [] : items}
          limit={limit ?? undefined}
          sort={sort}
          showBars={showBars}
          showRank={showRank}
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
          Edita las filas del panel y el ranking se actualiza al instante. Clic en una fila para ver{' '}
          <code>onItemClick</code>.
        </>
      }
    />
  );
}
