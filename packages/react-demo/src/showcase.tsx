import { useState } from 'react';
import { BarChart, type ChartPointEvent } from 'kai-charts-react';
import {
  AGE_RANGE,
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

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

/** The six reference charts of the Angular demo, with the same datasets, titles and hints. */
export function Showcase({ loading, empty, showTable }: ShowcaseProps) {
  const [lastClick, setLastClick] = useState<ChartPointEvent | null>(null);
  const common = { loading, showTable, onBarClick: setLastClick };

  return (
    <>
      <main className="grid">
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
      </main>

      <footer className="status" aria-live="polite">
        {lastClick ? (
          <>
            Último clic: <strong>{lastClick.category}</strong> · {lastClick.series} ={' '}
            {lastClick.value}
          </>
        ) : (
          <>
            Haz clic (o Enter/Espacio con el teclado) sobre una barra para ver el evento{' '}
            <code>onBarClick</code>.
          </>
        )}
      </footer>
    </>
  );
}
