import { useMemo, useState } from 'react';
import type { ChartSeries } from 'kai-charts-react';
import type { BarSample } from '../sample-data';
import { defaultColor, parseNumber, random, useCopy } from './shared';

export interface PlaySeries {
  name: string;
  /** Empty string = automatic palette color. */
  color: string;
  data: (number | null)[];
}

/** State and handlers of the matrix editor (categories × series), owned by the sandbox. */
export interface MatrixState {
  categoriesText: string;
  setCategoriesText: (text: string) => void;
  series: PlaySeries[];
  /** Categories derived from the textarea (one per non-empty line). */
  categories: string[];
  /** What the chart receives: series aligned to the categories, blanks as `null`. */
  chartSeries: ChartSeries[];
  updateSeries: (index: number, patch: Partial<PlaySeries>) => void;
  addSeries: () => void;
  removeSeries: (index: number) => void;
  setCell: (seriesIndex: number, categoryIndex: number, raw: string) => void;
  randomize: () => void;
}

export function useMatrixData(initial: BarSample): MatrixState {
  // The raw textarea text is the state; categories are derived (rewriting the textarea from
  // the filtered list would make the caret jump).
  const [categoriesText, setCategoriesText] = useState(initial.categories.join('\n'));
  const [series, setSeries] = useState<PlaySeries[]>(() =>
    initial.series.map((s) => ({
      name: s.name,
      color: s.color ?? '',
      data: s.data.map((v) => v ?? null),
    })),
  );

  const categories = useMemo(
    () =>
      categoriesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [categoriesText],
  );

  const chartSeries = useMemo<ChartSeries[]>(
    () =>
      series.map((s) => ({
        name: s.name || 'Serie',
        color: s.color || undefined,
        data: categories.map((_, i) => s.data[i] ?? null),
      })),
    [series, categories],
  );

  const updateSeries = (index: number, patch: Partial<PlaySeries>) =>
    setSeries((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addSeries = () =>
    setSeries((list) => [
      ...list,
      { name: `Serie ${list.length + 1}`, color: '', data: categories.map(random) },
    ]);

  const removeSeries = (index: number) => setSeries((list) => list.filter((_, i) => i !== index));

  const setCell = (seriesIndex: number, categoryIndex: number, raw: string) => {
    const value = parseNumber(raw);
    setSeries((list) =>
      list.map((s, i) => {
        if (i !== seriesIndex) return s;
        const data = [...s.data];
        while (data.length <= categoryIndex) data.push(null);
        data[categoryIndex] = value;
        return { ...s, data };
      }),
    );
  };

  const randomize = () =>
    setSeries((list) =>
      list.map((s) => ({ ...s, data: Array.from({ length: categories.length }, random) })),
    );

  return {
    categoriesText,
    setCategoriesText,
    series,
    categories,
    chartSeries,
    updateSeries,
    addSeries,
    removeSeries,
    setCell,
    randomize,
  };
}

/**
 * Matrix editor used by the bar and line sandboxes: categories textarea, series list
 * (name, color, Quitar, + Serie), value table, "Aleatorio" and "Copiar JSON".
 */
export function MatrixEditor({ state }: { state: MatrixState }) {
  const {
    categoriesText,
    setCategoriesText,
    series,
    categories,
    chartSeries,
    updateSeries,
    addSeries,
    removeSeries,
    setCell,
    randomize,
  } = state;
  const [copied, copy] = useCopy();
  const copyJson = () => copy(JSON.stringify({ categories, series: chartSeries }, null, 2));

  return (
    <>
      <label className="field">
        Categorías (una por línea)
        <textarea
          rows={6}
          value={categoriesText}
          onChange={(e) => setCategoriesText(e.target.value)}
        />
      </label>

      <div className="series-list">
        {series.map((s, i) => (
          <div className="series-row" key={i}>
            <input
              type="text"
              value={s.name}
              onChange={(e) => updateSeries(i, { name: e.target.value })}
              aria-label="Nombre de la serie"
              placeholder="Nombre"
            />
            <input
              type="color"
              value={s.color || defaultColor(i)}
              onChange={(e) => updateSeries(i, { color: e.target.value })}
              aria-label="Color de la serie"
            />
            <input
              type="text"
              className="color-text"
              value={s.color}
              onChange={(e) => updateSeries(i, { color: e.target.value })}
              aria-label="Color de la serie (CSS, opcional)"
              placeholder="auto"
            />
            <button type="button" onClick={() => removeSeries(i)} disabled={series.length === 1}>
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="secondary" onClick={addSeries}>
          + Serie
        </button>
      </div>

      <div className="values-wrap">
        <table className="values">
          <thead>
            <tr>
              <th>Categoría</th>
              {series.map((s, i) => (
                <th key={i}>{s.name || 'Serie'}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c, ci) => (
              <tr key={ci}>
                <th>{c}</th>
                {series.map((s, si) => (
                  <td key={si}>
                    <input
                      type="number"
                      value={s.data[ci] ?? ''}
                      onChange={(e) => setCell(si, ci, e.target.value)}
                      aria-label={`${c} · ${s.name}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button type="button" onClick={randomize}>
          Aleatorio
        </button>
        <button type="button" onClick={copyJson}>
          {copied ? '¡Copiado!' : 'Copiar JSON'}
        </button>
      </div>
    </>
  );
}
