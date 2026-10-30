import type { TooltipState } from 'kai-charts-core';

export interface TooltipProps {
  /** `null` renders nothing. */
  state: TooltipState | null;
}

/**
 * Visual tooltip, absolutely positioned inside the chart `.kc-plot`. It is `aria-hidden`:
 * the data point that opens it already carries the same information in its `aria-label`.
 */
export function Tooltip({ state }: TooltipProps) {
  if (!state) return null;
  const placement =
    state.placement === 'right'
      ? ' kc-tooltip--right'
      : state.placement === 'left'
        ? ' kc-tooltip--left'
        : '';
  return (
    <div
      className={`kc-tooltip${placement}`}
      style={{ left: `${state.x}px`, top: `${state.y}px` }}
      aria-hidden="true"
    >
      <div className="kc-tooltip__title">{state.title}</div>
      {state.rows.map((row, index) => (
        <div
          key={index}
          className={row.active ? 'kc-tooltip__row kc-tooltip__row--active' : 'kc-tooltip__row'}
        >
          {row.color ? (
            <span className="kc-tooltip__swatch" style={{ background: row.color }} />
          ) : null}
          <span className="kc-tooltip__name">{row.name}</span>
          <span className="kc-tooltip__value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
