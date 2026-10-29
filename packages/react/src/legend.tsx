import type { LegendItem } from 'kai-charts-core';

export interface LegendProps {
  items: readonly LegendItem[];
  /** When false the items are plain, disabled buttons (no toggling). */
  interactive?: boolean;
  /** Called with the index of the clicked item so the chart can toggle that series. */
  onToggle?: (index: number) => void;
}

/**
 * Series legend. Same markup as the Angular `kc-legend` so
 * `kai-charts-core/styles/legend.css` serves both renderers.
 */
export function Legend({ items, interactive = true, onToggle }: LegendProps) {
  return (
    <ul className="kc-legend">
      {items.map((item, index) => (
        <li key={index}>
          <button
            type="button"
            className={item.hidden ? 'kc-legend__item kc-legend__item--hidden' : 'kc-legend__item'}
            aria-pressed={interactive ? !item.hidden : undefined}
            disabled={!interactive}
            onClick={() => onToggle?.(index)}
          >
            <span
              className="kc-legend__swatch"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            <span>{item.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
