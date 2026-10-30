import { useMemo, useState } from 'react';
import {
  RankingTable,
  type SortChangeEvent,
  type SortDirection,
  type TableRow,
} from 'kai-charts-react';
import { RANKING_TABLE_COLUMNS, RANKING_TABLE_ROWS } from '../../sample-data';
import { Check, LocaleFormatFields, NumberField, SelectField, TextField } from '../fields';
import { RowsEditor, type RowsColumn } from '../rows-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import {
  constLine,
  formatProps,
  jsx,
  randomInt,
  resolveFormat,
  snippet,
  type FormatKey,
} from '../shared';

type TableEditRow = {
  id?: string;
  label: string;
  sublabel: string;
  procedures: number | null;
  avg: number | null;
  days: number | null;
};

type SortKey = 'none' | 'procedures' | 'avg' | 'days';

const SORT_KEYS = [
  { value: 'none', label: 'Sin ordenar' },
  { value: 'procedures', label: 'Trámites' },
  { value: 'avg', label: 'Tiempo medio' },
  { value: 'days', label: 'Jornadas' },
] as const;
const DIRECTIONS = [
  { value: 'desc', label: 'Descendente' },
  { value: 'asc', label: 'Ascendente' },
] as const;

const COLUMNS: RowsColumn<TableEditRow>[] = [
  { key: 'label', label: 'Etiqueta', type: 'text' },
  { key: 'sublabel', label: 'Subetiqueta', type: 'text' },
  { key: 'procedures', label: 'Trámites', type: 'number', random: () => randomInt(1000, 5000) },
  { key: 'avg', label: 'Tiempo medio', type: 'number', random: () => randomInt(10, 40) },
  { key: 'days', label: 'Jornadas', type: 'number', random: () => randomInt(5, 20) },
];

const INITIAL_ROWS: TableEditRow[] = RANKING_TABLE_ROWS.map((row) => ({
  id: row.id,
  label: row.label,
  sublabel: row.sublabel ?? '',
  procedures: Number(row.values.procedures ?? 0),
  avg: Number(row.values.avg ?? 0),
  days: Number(row.values.days ?? 0),
}));

const newRow = (rows: readonly TableEditRow[]): TableEditRow => ({
  label: `Unidad ${rows.length + 1}`,
  sublabel: '',
  procedures: randomInt(1000, 5000),
  avg: randomInt(10, 40),
  days: randomInt(5, 20),
});

const toRows = (rows: readonly TableEditRow[]): TableRow[] =>
  rows.map((row) => ({
    id: row.id,
    label: row.label || 'Fila',
    sublabel: row.sublabel || undefined,
    values: { procedures: row.procedures, avg: row.avg, days: row.days },
  }));

/** The columns carry a format function, so the snippet writes them by hand. */
const COLUMNS_SNIPPET = `const columns = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => \`\${v} min\` },
  { key: 'days', header: 'Jornadas' },
];`;

export function TableSandbox() {
  const [rows, setRows] = useState<TableEditRow[]>(INITIAL_ROWS);

  // Controlled sort, as in the showcase: header clicks only ask, the host applies.
  const [sortBy, setSortBy] = useState<SortKey>('procedures');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [limit, setLimit] = useState<number | null>(null);
  const [showRank, setShowRank] = useState(true);
  const [entityHeader, setEntityHeader] = useState('Estado / Unidad');
  const [caption, setCaption] = useState('');
  const [label, setLabel] = useState('Ranking de eficiencia por unidad móvil');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const tableRows = useMemo(() => toRows(rows), [rows]);

  const code = useMemo(() => {
    const props = ['rows={rows}', 'columns={columns}'];
    if (sortBy !== 'none') props.push(`sortBy="${sortBy}"`);
    if (sortDirection !== 'desc') props.push(`sortDirection="${sortDirection}"`);
    if (limit !== null) props.push(`limit={${limit}}`);
    if (!showRank) props.push('showRank={false}');
    if (entityHeader !== 'Estado / Unidad') props.push(`entityHeader="${entityHeader}"`);
    if (caption) props.push(`caption="${caption}"`);
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onSortChange={onSortChange}', 'onRowClick={onRowClick}');
    return snippet([COLUMNS_SNIPPET, constLine('rows', tableRows)], jsx('RankingTable', props));
  }, [
    tableRows,
    sortBy,
    sortDirection,
    limit,
    showRank,
    entityHeader,
    caption,
    label,
    locale,
    format,
    loading,
  ]);

  const onSortChange = (e: SortChangeEvent) => {
    setSortBy(e.key as SortKey);
    setSortDirection(e.direction);
    setLastEvent({
      name: 'onSortChange',
      summary: (
        <>
          <strong>{e.key}</strong> · {e.direction}
        </>
      ),
    });
  };
  const onRowClick = (row: TableRow) =>
    setLastEvent({
      name: 'onRowClick',
      summary: (
        <>
          <strong>{row.label}</strong> = {row.values.procedures ?? '—'}
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
          json={tableRows}
          label="Filas de la tabla"
        />
      }
      options={
        <>
          <SelectField
            label="Ordenar por (sortBy)"
            value={sortBy}
            options={SORT_KEYS}
            onChange={setSortBy}
          />
          <SelectField
            label="Dirección (sortDirection)"
            value={sortDirection}
            options={DIRECTIONS}
            onChange={setSortDirection}
          />
          <NumberField
            label="Límite (limit)"
            value={limit}
            placeholder="todas"
            step={1}
            min={1}
            onChange={setLimit}
          />
          <Check label="Posición" checked={showRank} onChange={setShowRank} />
          <Check label="Cargando" checked={loading} onChange={setLoading} />
          <Check label="Sin datos" checked={empty} onChange={setEmpty} />
          <TextField label="Cabecera de entidad" value={entityHeader} onChange={setEntityHeader} />
          <TextField label="Título (caption)" value={caption} onChange={setCaption} />
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
        <RankingTable
          rows={empty ? [] : tableRows}
          columns={RANKING_TABLE_COLUMNS}
          sortBy={sortBy === 'none' ? undefined : sortBy}
          sortDirection={sortDirection}
          limit={limit ?? undefined}
          showRank={showRank}
          entityHeader={entityHeader}
          caption={caption}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format)}
          loading={loading}
          onSortChange={onSortChange}
          onRowClick={onRowClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita las filas del panel y la tabla se actualiza al instante. Clic en una fila para ver{' '}
          <code>onRowClick</code>; en una cabecera numérica, <code>onSortChange</code>.
        </>
      }
    />
  );
}
