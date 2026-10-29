import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart,
  KC_DEFAULT_PALETTE,
  type ChartPointEvent,
  type ChartSeries,
  type Orientation,
  type ValueFormat,
} from 'kai-charts-react';
import { PROCEDURES_BY_DAY } from './sample-data';
import './playground.css';

interface PlaySeries {
  name: string;
  /** Empty string = automatic palette color. */
  color: string;
  data: (number | null)[];
}

type FormatKey = 'number' | 'percent' | 'currency' | 'compact';
type LegendMode = 'auto' | 'true' | 'false';
type Copied = 'json' | 'code' | null;

const FORMATS: Record<FormatKey, Intl.NumberFormatOptions> = {
  number: {},
  percent: { style: 'percent', maximumFractionDigits: 0 },
  currency: { style: 'currency', currency: 'VES', maximumFractionDigits: 0 },
  compact: { notation: 'compact' },
};

const LOCALES = ['es-VE', 'en-US', 'pt-BR', 'de-DE'];

const random = () => Math.floor(Math.random() * 201);
const defaultColor = (index: number) => KC_DEFAULT_PALETTE[index % KC_DEFAULT_PALETTE.length];

/** `{ style: 'percent', maximumFractionDigits: 0 }` — an object literal valid in JSX. */
function literal(options: Intl.NumberFormatOptions): string {
  const entries = Object.entries(options).map(
    ([key, value]) => `${key}: ${typeof value === 'string' ? `'${value}'` : value}`,
  );
  return `{ ${entries.join(', ')} }`;
}

/** Clipboard helper with a short "¡Copiado!" feedback. */
function useCopy(): [Copied, (text: string, what: 'json' | 'code') => void] {
  const [copied, setCopied] = useState<Copied>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = (text: string, what: 'json' | 'code') => {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(what);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1500);
  };
  return [copied, copy];
}

/**
 * Interactive sandbox: every number and option is editable on the left, the chart on the
 * right reacts live, and the generated JSX can be copied into a real app.
 */
export function Playground() {
  // Data
  const [categoriesText, setCategoriesText] = useState(PROCEDURES_BY_DAY.categories.join('\n'));
  const [series, setSeries] = useState<PlaySeries[]>(() =>
    PROCEDURES_BY_DAY.series.map((s) => ({
      name: s.name,
      color: s.color ?? '',
      data: s.data.map((v) => v ?? null),
    })),
  );

  // Options
  const [orientation, setOrientation] = useState<Orientation>('vertical');
  const [stacked, setStacked] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [legend, setLegend] = useState<LegendMode>('auto');
  const [height, setHeight] = useState(280);
  const [barRadius, setBarRadius] = useState(2);
  const [label, setLabel] = useState('Trámites por día de jornada');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');

  const [lastClick, setLastClick] = useState<ChartPointEvent | null>(null);
  const [copied, copy] = useCopy();

  const categories = useMemo(
    () =>
      categoriesText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [categoriesText],
  );

  /** What the chart receives: series aligned to the categories, or no data at all. */
  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (empty) return [{ name: 'Serie', data: [] }];
    return series.map((s) => ({
      name: s.name || 'Serie',
      color: s.color || undefined,
      data: categories.map((_, i) => s.data[i] ?? null),
    }));
  }, [empty, series, categories]);

  const valueFormat: ValueFormat = FORMATS[format];
  const legendValue: boolean | 'auto' = legend === 'auto' ? 'auto' : legend === 'true';

  const code = useMemo(() => {
    const props = ['categories={categories}', 'series={series}'];
    if (orientation === 'horizontal') props.push('orientation="horizontal"');
    if (stacked) props.push('stacked');
    if (showValues) props.push('showValues');
    if (!showGrid) props.push('showGrid={false}');
    if (showTable) props.push('showTable');
    if (legend !== 'auto') props.push(`showLegend={${legend}}`);
    if (height !== 280) props.push(`height={${height}}`);
    if (barRadius !== 2) props.push(`barRadius={${barRadius}}`);
    if (label) props.push(`label="${label}"`);
    if (locale !== 'es-VE') props.push(`locale="${locale}"`);
    if (format !== 'number') props.push(`valueFormat={${literal(FORMATS[format])}}`);
    if (loading) props.push('loading');
    props.push('onBarClick={onBarClick}');
    return `<BarChart\n  ${props.join('\n  ')}\n/>`;
  }, [
    orientation,
    stacked,
    showValues,
    showGrid,
    showTable,
    legend,
    height,
    barRadius,
    label,
    locale,
    format,
    loading,
  ]);

  const updateSeries = (index: number, patch: Partial<PlaySeries>) =>
    setSeries((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addSeries = () =>
    setSeries((list) => [
      ...list,
      { name: `Serie ${list.length + 1}`, color: '', data: categories.map(random) },
    ]);

  const removeSeries = (index: number) => setSeries((list) => list.filter((_, i) => i !== index));

  const setCell = (seriesIndex: number, categoryIndex: number, raw: string) => {
    const trimmed = raw.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    const value = parsed === null || Number.isNaN(parsed) ? null : parsed;
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

  const copyJson = () => copy(JSON.stringify({ categories, series: chartSeries }, null, 2), 'json');

  return (
    <div className="play">
      <aside className="panel">
        <section>
          <h2>Datos</h2>
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
                <button
                  type="button"
                  onClick={() => removeSeries(i)}
                  disabled={series.length === 1}
                >
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
              {copied === 'json' ? '¡Copiado!' : 'Copiar JSON'}
            </button>
          </div>
        </section>

        <section>
          <h2>Opciones</h2>
          <div className="options">
            <label className="field">
              Orientación
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as Orientation)}
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </label>
            <label className="field">
              Leyenda
              <select value={legend} onChange={(e) => setLegend(e.target.value as LegendMode)}>
                <option value="auto">Automática</option>
                <option value="true">Siempre</option>
                <option value="false">Nunca</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={stacked}
                onChange={(e) => setStacked(e.target.checked)}
              />
              Apilado
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={showValues}
                onChange={(e) => setShowValues(e.target.checked)}
              />
              Valores
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Grilla
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={showTable}
                onChange={(e) => setShowTable(e.target.checked)}
              />
              Tabla espejo
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={loading}
                onChange={(e) => setLoading(e.target.checked)}
              />
              Cargando
            </label>
            <label className="check">
              <input type="checkbox" checked={empty} onChange={(e) => setEmpty(e.target.checked)} />
              Sin datos
            </label>
            <label className="field">
              Alto: {height} px
              <input
                type="range"
                min={160}
                max={480}
                step={20}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Radio de barra: {barRadius} px
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={barRadius}
                onChange={(e) => setBarRadius(Number(e.target.value))}
              />
            </label>
            <label className="field wide">
              Etiqueta accesible (label)
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
            </label>
            <label className="field">
              Locale
              <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Formato
              <select value={format} onChange={(e) => setFormat(e.target.value as FormatKey)}>
                <option value="number">Número</option>
                <option value="percent">Porcentaje</option>
                <option value="currency">Moneda VES</option>
                <option value="compact">Compacto</option>
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2>Código</h2>
          <pre>
            <code>{code}</code>
          </pre>
          <button type="button" onClick={() => copy(code, 'code')}>
            {copied === 'code' ? '¡Copiado!' : 'Copiar'}
          </button>
        </section>
      </aside>

      <div className="stage">
        <div className="card">
          <BarChart
            categories={categories}
            series={chartSeries}
            orientation={orientation}
            stacked={stacked}
            showValues={showValues}
            showGrid={showGrid}
            showTable={showTable}
            showLegend={legendValue}
            height={height}
            barRadius={barRadius}
            loading={loading}
            label={label}
            locale={locale}
            valueFormat={valueFormat}
            onBarClick={setLastClick}
          />
        </div>
        <p className="status" aria-live="polite">
          {lastClick ? (
            <>
              Último clic: <strong>{lastClick.category}</strong> · {lastClick.series} ={' '}
              {lastClick.value}
            </>
          ) : (
            <>
              Edita los números del panel y el gráfico se actualiza al instante. Clic en una barra
              para ver <code>onBarClick</code>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
