import { useState } from 'react';
import {
  BarChart,
  KpiCard,
  ProgressList,
  RankingList,
  type ChartPointEvent,
  type ProgressItem,
  type RankingItem,
} from 'kai-charts-react';
import { KpiIcon } from './kpi-icon';
import {
  AGE_RANGE,
  CITIZENS_BY_STATE,
  DENSITY,
  KPIS,
  MONTHLY_VARIATION,
  NO_DATA,
  PROCEDURES_BY_DAY,
  PROCEDURES_BY_TYPE,
  PROCEDURES_BY_TYPE_PHASE_1,
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
  value: number;
}

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

/** The reference blocks of the Angular demo (indicadores, barras, listas), same data and texts. */
export function Showcase({ loading, empty, showTable }: ShowcaseProps) {
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
  const onBarClick = (e: ChartPointEvent) =>
    setLastEvent({ label: e.category, source: e.series, value: e.value });
  const onDensityClick = (item: ProgressItem) =>
    setLastEvent({ label: item.label, source: 'Densidad', value: item.value });
  const onCitizensClick = (item: RankingItem) =>
    setLastEvent({ label: item.label, source: 'Ciudadanos', value: item.value });
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
          <h2 className="block__title">Barras</h2>
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
                Apilado horizontal con colores propios por serie y total al final de cada barra.
              </p>
              <BarChart
                {...common}
                orientation="horizontal"
                stacked
                showValues
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
          </div>
        </section>

        <section className="block">
          <h2 className="block__title">Listas</h2>
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
            Haz clic (o Enter/Espacio con el teclado) sobre una barra o una fila para ver los
            eventos <code>onBarClick</code> / <code>onItemClick</code>.
          </>
        )}
      </footer>
    </>
  );
}
