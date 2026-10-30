import { useMemo, useState } from 'react';
import {
  MonthCalendar,
  type CalendarDayView,
  type CalendarEvent,
  type MonthChangeEvent,
} from 'kai-charts-react';
import { CALENDAR_EVENTS, CALENDAR_KINDS } from '../../sample-data';
import { Check, LocaleFormatFields, NumberField, SelectField, TextField } from '../fields';
import { RowsEditor, type RowsColumn } from '../rows-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import { constLine, jsx, randomInt, snippet } from '../shared';

type EventRow = { date: string; kind: string; count: number | null };
type WeekStart = '1' | '0';

const DEFAULT_DAY = '2026-10-09';
const KIND_OPTIONS = CALENDAR_KINDS.map((kind) => ({ value: kind.kind, label: kind.name }));
const WEEK_STARTS = [
  { value: '1', label: 'Lunes' },
  { value: '0', label: 'Domingo' },
] as const;

const COLUMNS: RowsColumn<EventRow>[] = [
  { key: 'date', label: 'Fecha', type: 'text', placeholder: 'YYYY-MM-DD' },
  { key: 'kind', label: 'Tipo', type: 'select', options: KIND_OPTIONS },
  {
    key: 'count',
    label: 'Cantidad',
    type: 'number',
    placeholder: '1',
    random: () => randomInt(1, 3),
  },
];

const INITIAL_ROWS: EventRow[] = CALENDAR_EVENTS.map((event) => ({
  date: event.date,
  kind: event.kind,
  count: event.count ?? null,
}));

const newRow = (rows: readonly EventRow[]): EventRow => ({
  date: `2026-10-${String(randomInt(1, 28)).padStart(2, '0')}`,
  kind: CALENDAR_KINDS[rows.length % CALENDAR_KINDS.length].kind,
  count: null,
});

const toEvents = (rows: readonly EventRow[]): CalendarEvent[] =>
  rows.map((row) => ({ date: row.date, kind: row.kind, count: row.count ?? undefined }));

const pad2 = (n: number) => String(n).padStart(2, '0');

export function CalendarSandbox() {
  const [rows, setRows] = useState<EventRow[]>(INITIAL_ROWS);

  // Controlled month: the nav buttons only ask, the host updates year/month.
  const [year, setYear] = useState<number | null>(2026);
  const [month, setMonth] = useState<number | null>(10);
  const [selected, setSelected] = useState(DEFAULT_DAY);
  const [today, setToday] = useState(DEFAULT_DAY);
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStart>('1');
  const [showLegend, setShowLegend] = useState(true);
  const [showNav, setShowNav] = useState(true);
  const [footer, setFooter] = useState('Cumplimiento: 89,3 %');
  const [label, setLabel] = useState('Calendario de jornadas');
  const [locale, setLocale] = useState('es-VE');
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const events = useMemo(() => toEvents(rows), [rows]);

  const code = useMemo(() => {
    const props: string[] = [];
    if (year !== null) props.push(`year={${year}}`);
    if (month !== null) props.push(`month={${month}}`);
    props.push('events={events}', 'kinds={kinds}');
    if (selected) props.push(`selected="${selected}"`);
    if (today) props.push(`today="${today}"`);
    if (weekStartsOn !== '1') props.push(`weekStartsOn={${weekStartsOn}}`);
    if (!showLegend) props.push('showLegend={false}');
    if (!showNav) props.push('showNav={false}');
    if (footer) props.push(`footer="${footer}"`);
    if (label) props.push(`label="${label}"`);
    if (locale !== 'es-VE') props.push(`locale="${locale}"`);
    if (loading) props.push('loading');
    props.push('onMonthChange={onMonthChange}', 'onDayClick={onDayClick}');
    return snippet(
      [constLine('events', events), constLine('kinds', CALENDAR_KINDS)],
      jsx('MonthCalendar', props),
    );
  }, [
    events,
    year,
    month,
    selected,
    today,
    weekStartsOn,
    showLegend,
    showNav,
    footer,
    label,
    locale,
    loading,
  ]);

  const onMonthChange = (e: MonthChangeEvent) => {
    setYear(e.year);
    setMonth(e.month);
    setLastEvent({
      name: 'onMonthChange',
      summary: (
        <strong>
          {e.year}-{pad2(e.month)}
        </strong>
      ),
    });
  };
  const onDayClick = (day: CalendarDayView) =>
    setLastEvent({
      name: 'onDayClick',
      summary: (
        <>
          <strong>{day.iso}</strong> · {day.events.length} eventos
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
          json={events}
          label="Eventos del calendario"
        />
      }
      options={
        <>
          <NumberField
            label="Año (year)"
            value={year}
            step={1}
            placeholder="actual"
            onChange={setYear}
          />
          <NumberField
            label="Mes (month)"
            value={month}
            step={1}
            min={1}
            max={12}
            placeholder="actual"
            onChange={setMonth}
          />
          <TextField
            label="Seleccionado (selected)"
            value={selected}
            onChange={setSelected}
            placeholder="YYYY-MM-DD"
          />
          <TextField
            label="Hoy (today)"
            value={today}
            onChange={setToday}
            placeholder="YYYY-MM-DD"
          />
          <SelectField
            label="Primer día de la semana"
            value={weekStartsOn}
            options={WEEK_STARTS}
            onChange={setWeekStartsOn}
          />
          <TextField label="Pie (footer)" value={footer} onChange={setFooter} />
          <Check label="Leyenda" checked={showLegend} onChange={setShowLegend} />
          <Check label="Navegación" checked={showNav} onChange={setShowNav} />
          <Check label="Cargando" checked={loading} onChange={setLoading} />
          <TextField label="Etiqueta accesible (label)" value={label} onChange={setLabel} wide />
          <LocaleFormatFields locale={locale} onLocale={setLocale} />
        </>
      }
      code={code}
      chart={
        <MonthCalendar
          year={year ?? undefined}
          month={month ?? undefined}
          events={events}
          kinds={CALENDAR_KINDS}
          selected={selected || undefined}
          today={today || undefined}
          weekStartsOn={Number(weekStartsOn)}
          showLegend={showLegend}
          showNav={showNav}
          footer={footer}
          label={label}
          locale={locale}
          loading={loading}
          onMonthChange={onMonthChange}
          onDayClick={onDayClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita los eventos del panel y el calendario se actualiza al instante. Clic en un día para
          ver <code>onDayClick</code>; en las flechas, <code>onMonthChange</code>.
        </>
      }
    />
  );
}
