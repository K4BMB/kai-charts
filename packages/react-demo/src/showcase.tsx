import { useEffect, useState } from 'react';
import {
  BarChart,
  KpiCard,
  LineChart,
  MonthCalendar,
  ProgressList,
  RankingList,
  RankingTable,
  RingChart,
  VenezuelaMap,
  type CalendarDayView,
  type ChartPointEvent,
  type MapDatum,
  type MapRegionClickEvent,
  type MonthChangeEvent,
  type ProgressItem,
  type RankingItem,
  type RingItem,
  type SortChangeEvent,
  type TableRow,
} from 'kai-charts-react';
import { KpiIcon } from './kpi-icon';
import {
  AGE_RANGE,
  CALENDAR_EVENTS,
  CALENDAR_KINDS,
  CITIZENS_BY_STATE,
  ARRIVAL_SEQUENCE,
  DENSITY,
  KPIS,
  LINE_SAMPLE,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
  RANKING_TABLE_COLUMNS,
  RANKING_TABLE_ROWS,
  RINGS,
  SYNC_STATE,
} from './sample-data';
import './showcase.css';

export interface ShowcaseProps {
  loading: boolean;
  empty: boolean;
  showTable: boolean;
}

/** Last event received from any chart or list, normalised for the status line. */
interface LastEvent {
  label: string;
  source: string;
  value: number | string;
}

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };
const ARRIVAL_INTERVAL_MS = 400;
/** Delay before the simulation starts by itself after the page shows up, in ms. */
const ARRIVAL_DELAY_MS = 800;
/** Month shown by the calendar at start; `selected`/`today` fall inside it. */
const CALENDAR_START: MonthChangeEvent = { year: 2026, month: 10 };
const CALENDAR_DAY = '2026-10-09';
/** Initial sort of the ranking table (the host owns it and updates it on `onSortChange`). */
const TABLE_SORT: SortChangeEvent = { key: 'procedures', direction: 'desc' };

/** Adds the next state of the arrival sequence; returns the same array when complete. */
function nextArrival(current: MapDatum[]): MapDatum[] {
  const next = ARRIVAL_SEQUENCE[current.length];
  return next ? [...current, next] : current;
}

/** The reference blocks of the Angular demo (indicadores, mapa, barras y líneas, listas y anillos). */
export function Showcase({ loading, empty, showTable }: ShowcaseProps) {
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
  // The map starts EMPTY (all grey) and fills in state by state while the simulation runs.
  const [mapData, setMapData] = useState<MapDatum[]>([]);
  const [simulating, setSimulating] = useState(false);
  // Controlled calendar month and table sort: the components only ask, the host decides.
  const [calendarMonth, setCalendarMonth] = useState<MonthChangeEvent>(CALENDAR_START);
  const [tableSort, setTableSort] = useState<SortChangeEvent>(TABLE_SORT);

  // The simulation starts by itself shortly after the page shows up: that behaviour is what the
  // map exists for, so the visitor sees it without clicking anything.
  useEffect(() => {
    const timer = setTimeout(() => setSimulating(true), ARRIVAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  // Data arrival: one more state every 400 ms, in ARRIVAL_SEQUENCE order, until all 25 have a value.
  useEffect(() => {
    if (!simulating) return undefined;
    const timer = setInterval(() => setMapData(nextArrival), ARRIVAL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [simulating]);
  const mapComplete = mapData.length >= ARRIVAL_SEQUENCE.length;
  useEffect(() => {
    if (mapComplete) setSimulating(false);
  }, [mapComplete]);

  /** Replays the arrival from an empty map. */
  const startSimulation = () => {
    setMapData([]);
    setSimulating(true);
  };
  /** Stops the simulation and leaves the map grey again. */
  const resetMap = () => {
    setSimulating(false);
    setMapData([]);
  };

  const onBarClick = (e: ChartPointEvent) =>
    setLastEvent({ label: e.category, source: e.series, value: e.value });
  const onDensityClick = (item: ProgressItem) =>
    setLastEvent({ label: item.label, source: 'Densidad', value: item.value });
  const onCitizensClick = (item: RankingItem) =>
    setLastEvent({ label: item.label, source: 'Ciudadanos', value: item.value });
  const onRegionClick = (e: MapRegionClickEvent) =>
    setLastEvent({ label: e.name, source: 'Mapa', value: e.value ?? '—' });
  const onRingClick = (item: RingItem) =>
    setLastEvent({ label: item.name, source: 'Anillos', value: item.value });
  const onUnitClick = (row: TableRow) =>
    setLastEvent({ label: row.label, source: 'Unidad móvil', value: row.values.procedures ?? '—' });
  const onDayClick = (day: CalendarDayView) =>
    setLastEvent({ label: day.iso, source: 'Día', value: day.events.length });
  const common = { loading, showTable, onBarClick };

  return (
    <>
      <main>
        <section className="block">
          <h2 className="block__title">Indicadores</h2>
          <div className="kpi-grid">
            {KPIS.map((k) => (
              <div className="card" key={k.label}>
                <KpiCard
                  label={k.label}
                  value={k.value}
                  subtext={k.subtext}
                  trend={k.trend}
                  invertTrend={k.invertTrend}
                  valueFormat={k.valueFormat}
                  loading={loading}
                  icon={<KpiIcon name={k.icon} />}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="block">
          <h2 className="block__title">Mapa</h2>
          <section className="card">
            <h2>Ciudadanos atendidos por estado</h2>
            <p className="hint">
              Coropleta que se va llenando a medida que llegan los datos: arranca en gris y cada
              estado se pinta cuando recibe su valor (aquí llega uno cada 0,4 s; la opacidad crece
              con el valor). Punto = capital del estado (nombre en el tooltip); Zona en Reclamación
              rayada. Marcadores por lat/lng y resaltado de estados, en el Playground.
            </p>
            <div className="map-actions">
              <button
                type="button"
                onClick={startSimulation}
                disabled={simulating || empty || loading}
              >
                Simular llegada de datos
              </button>
              <button type="button" className="secondary" onClick={resetMap}>
                Reiniciar
              </button>
            </div>
            <div className="map-layout">
              <VenezuelaMap
                data={empty ? [] : mapData}
                loading={loading}
                showTable={showTable}
                valueHeader="Ciudadanos"
                label="Ciudadanos atendidos por estado"
                onRegionClick={onRegionClick}
              />
              <RankingList
                items={empty ? [] : CITIZENS_BY_STATE}
                limit={5}
                loading={loading}
                label="Top 5 de estados por ciudadanos atendidos"
                onItemClick={onCitizensClick}
              />
            </div>
          </section>
        </section>

        <section className="block">
          <h2 className="block__title">Barras y líneas</h2>
          <div className="grid">
            <section className="card">
              <h2>Trámites por tipo</h2>
              <p className="hint">
                Horizontal, una serie, valores visibles. Las etiquetas largas caben mejor así.
              </p>
              <BarChart
                {...common}
                orientation="horizontal"
                categories={PROCEDURES_BY_TYPE.categories}
                series={empty ? NO_DATA : PROCEDURES_BY_TYPE.series}
                showValues
                height={320}
                label="Trámites por tipo"
                categoryHeader="Tipo de trámite"
              />
            </section>

            <section className="card">
              <h2>Trámites por día</h2>
              <p className="hint">
                Vertical, dos series agrupadas. Clic en la leyenda para ocultar una serie.
              </p>
              <BarChart
                {...common}
                categories={PROCEDURES_BY_DAY.categories}
                series={empty ? NO_DATA : PROCEDURES_BY_DAY.series}
                label="Trámites por día de jornada"
                categoryHeader="Día"
              />
            </section>

            <section className="card">
              <h2>Estado de sincronización</h2>
              <p className="hint">
                Apilado horizontal con colores propios por serie, total al final y extremo
                redondeado (<code>roundStackTop</code> + <code>barRadius</code>). También
                configurables: <code>barWidth</code>, <code>showValueAxis</code> y{' '}
                <code>showCategoryAxis</code>.
              </p>
              <BarChart
                {...common}
                orientation="horizontal"
                stacked
                showValues
                roundStackTop
                barRadius={6}
                categories={SYNC_STATE.categories}
                series={empty ? NO_DATA : SYNC_STATE.series}
                height={220}
                label="Estado de sincronización por entidad"
                categoryHeader="Entidad"
              />
            </section>

            <section className="card">
              <h2>Rango de edad</h2>
              <p className="hint">
                Vertical, una serie, sin leyenda (automático) y con valores sobre las barras.
              </p>
              <BarChart
                {...common}
                showValues
                categories={AGE_RANGE.categories}
                series={empty ? NO_DATA : AGE_RANGE.series}
                label="Ciudadanos por rango de edad"
                categoryHeader="Rango"
              />
            </section>

            <section className="card">
              <h2>Variación mensual</h2>
              <p className="hint">
                Valores negativos (eje con cero intermedio) y formato Intl porcentual.
              </p>
              <BarChart
                {...common}
                showValues
                valueFormat={PERCENT}
                categories={MONTHLY_VARIATION.categories}
                series={empty ? NO_DATA : MONTHLY_VARIATION.series}
                height={240}
                label="Variación mensual de trámites"
                categoryHeader="Mes"
              />
            </section>

            <section className="card">
              <h2>Jornada sin trámites aún</h2>
              <p className="hint">
                Todo en cero no es “sin datos”: se dibuja el eje real con el catálogo. Pasa{' '}
                <code>emptyText</code> para el estado vacío.
              </p>
              <BarChart
                loading={loading}
                showTable={showTable}
                orientation="horizontal"
                categories={PROCEDURES_BY_TYPE_PHASE_1.categories}
                series={empty ? NO_DATA : PROCEDURES_BY_TYPE_PHASE_1.series}
                height={320}
                label="Trámites por tipo (jornada sin actas)"
                categoryHeader="Tipo de trámite"
                emptyText="Aún no hay trámites registrados"
              />
            </section>

            <section className="card">
              <h2>Ciudadanos atendidos por jornada</h2>
              <p className="hint">
                Curva monótona (sin rebotes), área suave y valor final de cada serie.
              </p>
              <LineChart
                loading={loading}
                showTable={showTable}
                curve="smooth"
                area
                showEndValues
                categories={LINE_SAMPLE.categories}
                series={empty ? NO_DATA : LINE_SAMPLE.series}
                label="Ciudadanos atendidos por jornada"
                categoryHeader="Mes"
                onPointClick={onBarClick}
              />
            </section>
          </div>
        </section>

        <section className="block">
          <h2 className="block__title">Listas y anillos</h2>
          <section className="card">
            <h2>Ranking de eficiencia por unidad móvil</h2>
            <p className="hint">
              Producción y tiempo medio de atención por trámite · clic en una cabecera numérica para
              ordenar
            </p>
            <RankingTable
              rows={empty ? [] : RANKING_TABLE_ROWS}
              columns={RANKING_TABLE_COLUMNS}
              sortBy={tableSort.key}
              sortDirection={tableSort.direction}
              loading={loading}
              label="Ranking de eficiencia por unidad móvil"
              onSortChange={setTableSort}
              onRowClick={onUnitClick}
            />
          </section>
          <div className="grid">
            <section className="card">
              <h2>Densidad de atención por región</h2>
              <p className="hint">
                Atenciones por 1.000 habitantes · semáforo decidido por el presenter
              </p>
              <ProgressList
                items={empty ? [] : DENSITY}
                loading={loading}
                label="Densidad de atención por región"
                onItemClick={onDensityClick}
              />
            </section>

            <section className="card">
              <h2>Ciudadanos atendidos por estado</h2>
              <p className="hint">Top 5 · últimos 6 meses</p>
              <RankingList
                items={empty ? [] : CITIZENS_BY_STATE}
                limit={5}
                loading={loading}
                label="Ciudadanos atendidos por estado"
                onItemClick={onCitizensClick}
              />
            </section>

            <section className="card">
              <h2>Atención nacional</h2>
              <p className="hint">
                Anillos concéntricos con valor central y leyenda con cifras (más legible que anillos
                sin etiqueta)
              </p>
              <RingChart
                items={empty ? [] : RINGS}
                loading={loading}
                centerLabel="Saldo"
                centerValue={0.917}
                centerTrend={0.038}
                label="Atención nacional"
                onRingClick={onRingClick}
              />
            </section>

            <section className="card">
              <h2>Calendario de jornadas</h2>
              <p className="hint">
                Puntos por tipo de evento, mes navegable; el host controla el mes y recibe el día
                clicado
              </p>
              <MonthCalendar
                year={calendarMonth.year}
                month={calendarMonth.month}
                events={empty ? [] : CALENDAR_EVENTS}
                kinds={CALENDAR_KINDS}
                selected={CALENDAR_DAY}
                today={CALENDAR_DAY}
                footer="Cumplimiento: 89,3 %"
                loading={loading}
                label="Calendario de jornadas"
                onMonthChange={setCalendarMonth}
                onDayClick={onDayClick}
              />
            </section>
          </div>
        </section>
      </main>

      <footer className="status" aria-live="polite">
        {lastEvent ? (
          <>
            Último clic: <strong>{lastEvent.label}</strong> · {lastEvent.source} = {lastEvent.value}
          </>
        ) : (
          <>
            Haz clic (o Enter/Espacio con el teclado) sobre una barra, un punto, un estado, un
            anillo, una fila o un día para ver los eventos <code>onBarClick</code> /{' '}
            <code>onPointClick</code> / <code>onRegionClick</code> / <code>onItemClick</code> /{' '}
            <code>onRowClick</code> / <code>onDayClick</code>.
          </>
        )}
      </footer>
    </>
  );
}
