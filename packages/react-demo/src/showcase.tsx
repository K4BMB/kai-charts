import { useEffect, useState } from 'react';
import {
  BarChart,
  KpiCard,
  LineChart,
  ProgressList,
  RankingList,
  RingChart,
  VENEZUELA_STATES,
  VenezuelaMap,
  type ChartPointEvent,
  type MapDatum,
  type MapMarker,
  type MapRegionClickEvent,
  type ProgressItem,
  type RankingItem,
  type RingItem,
} from 'kai-charts-react';
import { KpiIcon } from './kpi-icon';
import {
  AGE_RANGE,
  CITIZENS_BY_STATE,
  CITIZENS_MAP,
  DENSITY,
  KPIS,
  LINE_SAMPLE,
  MOBILE_UNITS,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
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
/** Top of `CITIZENS_BY_STATE`: outlined on the map. */
const TOP_STATE = 'VE-V';
const ARRIVAL_INTERVAL_MS = 500;
const NO_MARKERS: MapMarker[] = [];

/** Adds one random state without data (value 800–3.000); returns the same array when complete. */
function nextArrival(current: MapDatum[]): MapDatum[] {
  const missing = VENEZUELA_STATES.filter((state) => !current.some((d) => d.id === state.id));
  if (missing.length === 0) return current;
  const state = missing[Math.floor(Math.random() * missing.length)];
  const value = 800 + Math.round(Math.random() * 2200);
  return [...current, { id: state.id, value }];
}

/** The reference blocks of the Angular demo (indicadores, mapa, barras y líneas, listas y anillos). */
export function Showcase({ loading, empty, showTable }: ShowcaseProps) {
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
  const [mapData, setMapData] = useState<MapDatum[]>(CITIZENS_MAP);
  const [simulating, setSimulating] = useState(false);

  // Data arrival simulation: one more state every 500 ms until the 25 regions have a value.
  useEffect(() => {
    if (!simulating) return undefined;
    const timer = setInterval(() => setMapData(nextArrival), ARRIVAL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [simulating]);
  const mapComplete = mapData.length >= VENEZUELA_STATES.length;
  useEffect(() => {
    if (mapComplete) setSimulating(false);
  }, [mapComplete]);

  const startSimulation = () => setSimulating(true);
  const resetMap = () => {
    setSimulating(false);
    setMapData(CITIZENS_MAP);
  };

  const onBarClick = (e: ChartPointEvent) =>
    setLastEvent({ label: e.category, source: e.series, value: e.value });
  const onDensityClick = (item: ProgressItem) =>
    setLastEvent({ label: item.label, source: 'Densidad', value: item.value });
  const onCitizensClick = (item: RankingItem) =>
    setLastEvent({ label: item.label, source: 'Ciudadanos', value: item.value });
  const onRegionClick = (e: MapRegionClickEvent) =>
    setLastEvent({ label: e.name, source: 'Mapa', value: e.value ?? '—' });
  const onMarkerClick = (marker: MapMarker) =>
    setLastEvent({
      label: marker.label ?? marker.id,
      source: 'Unidad móvil',
      value: marker.value ?? '—',
    });
  const onRingClick = (item: RingItem) =>
    setLastEvent({ label: item.name, source: 'Anillos', value: item.value });
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
              Coropleta que se va llenando a medida que llegan los datos: los estados sin valor
              quedan en gris y la opacidad crece con el valor. Marcadores = unidades móviles.
            </p>
            <div className="map-actions">
              <button
                type="button"
                onClick={startSimulation}
                disabled={simulating || mapComplete || empty || loading}
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
                markers={empty ? NO_MARKERS : MOBILE_UNITS}
                highlight={TOP_STATE}
                loading={loading}
                showTable={showTable}
                valueHeader="Ciudadanos"
                label="Ciudadanos atendidos por estado"
                onRegionClick={onRegionClick}
                onMarkerClick={onMarkerClick}
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
            anillo o una fila para ver los eventos <code>onBarClick</code> /{' '}
            <code>onPointClick</code> / <code>onRegionClick</code> / <code>onItemClick</code>.
          </>
        )}
      </footer>
    </>
  );
}
