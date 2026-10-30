import type { ReactNode } from 'react';
import { CodeBox } from './code-box';

/** Last event received from the chart on the stage: its handler name and a short summary. */
export interface LastEvent {
  name: string;
  summary: ReactNode;
}

export interface SandboxLayoutProps {
  /** Content of the "Datos" section (an editor or plain fields). */
  data: ReactNode;
  /** Fields of the "Opciones" section (rendered inside the `.options` grid). */
  options: ReactNode;
  /** Generated snippet for the "Código" section. */
  code: string;
  /** The chart, rendered inside the stage card. */
  chart: ReactNode;
  /** Extra class for the stage card (e.g. a fixed width box). */
  cardClassName?: string;
  lastEvent: LastEvent | null;
  /** Status text shown before any event. */
  hint: ReactNode;
}

/**
 * The `.play` grid every sandbox renders: panel (Datos / Opciones / Código) on the left, the
 * live chart and the `.status` line on the right.
 */
export function SandboxLayout({
  data,
  options,
  code,
  chart,
  cardClassName,
  lastEvent,
  hint,
}: SandboxLayoutProps) {
  return (
    <div className="play">
      <aside className="panel">
        <section>
          <h2>Datos</h2>
          {data}
        </section>
        <section>
          <h2>Opciones</h2>
          <div className="options">{options}</div>
        </section>
        <CodeBox code={code} />
      </aside>

      <div className="stage">
        <div className={cardClassName ? `card ${cardClassName}` : 'card'}>{chart}</div>
        <p className="status" aria-live="polite">
          {lastEvent ? (
            <>
              Último evento: <code>{lastEvent.name}</code> · {lastEvent.summary}
            </>
          ) : (
            hint
          )}
        </p>
      </div>
    </div>
  );
}
