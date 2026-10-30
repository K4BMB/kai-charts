import type { ComponentType } from 'react';
import { CHARTS, type ChartId } from './playground/charts';
import { BarSandbox } from './playground/sandboxes/bar';
import { CalendarSandbox } from './playground/sandboxes/calendar';
import { KpiSandbox } from './playground/sandboxes/kpi';
import { LineSandbox } from './playground/sandboxes/line';
import { MapSandbox } from './playground/sandboxes/map';
import { ProgressSandbox } from './playground/sandboxes/progress';
import { RankingSandbox } from './playground/sandboxes/ranking';
import { RingSandbox } from './playground/sandboxes/ring';
import { TableSandbox } from './playground/sandboxes/table';
import './playground.css';

const SANDBOXES: Record<ChartId, ComponentType> = {
  bar: BarSandbox,
  line: LineSandbox,
  ring: RingSandbox,
  kpi: KpiSandbox,
  progress: ProgressSandbox,
  ranking: RankingSandbox,
  table: TableSandbox,
  calendar: CalendarSandbox,
  map: MapSandbox,
};

export interface PlaygroundProps {
  chart: ChartId;
}

/**
 * Interactive sandboxes, one per component: a picker chooses the chart; every number and
 * option is editable on the left, the chart on the right reacts live, and the generated JSX
 * can be copied into a real app.
 */
export function Playground({ chart }: PlaygroundProps) {
  const Sandbox = SANDBOXES[chart];
  return (
    <>
      <nav className="chart-picker" aria-label="Gráfico">
        {CHARTS.map((item) => {
          const active = item.id === chart;
          return (
            <a
              key={item.id}
              className={active ? 'chip chip--active' : 'chip'}
              href={`#/playground/${item.id}`}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
      <Sandbox key={chart} />
    </>
  );
}
