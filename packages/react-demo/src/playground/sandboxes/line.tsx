import { useMemo, useState } from 'react';
import { LineChart, type ChartPointEvent, type CurveType } from 'kai-charts-react';
import { LINE_SAMPLE, NO_DATA } from '../../sample-data';
import { Check, LocaleFormatFields, RangeField, SelectField, TextField } from '../fields';
import { MatrixEditor, useMatrixData } from '../matrix-editor';
import { SandboxLayout, type LastEvent } from '../sandbox-layout';
import {
  constLine,
  formatProps,
  jsx,
  legendValue,
  resolveFormat,
  snippet,
  type FormatKey,
  type LegendMode,
} from '../shared';

const CURVES = [
  { value: 'smooth', label: 'Suave (monótona)' },
  { value: 'linear', label: 'Recta' },
] as const;
const LEGEND_MODES = [
  { value: 'auto', label: 'Automática' },
  { value: 'true', label: 'Siempre' },
  { value: 'false', label: 'Nunca' },
] as const;

/** Line chart sandbox: same matrix editor as the bars, line-specific options. */
export function LineSandbox() {
  const matrix = useMatrixData(LINE_SAMPLE);

  const [curve, setCurve] = useState<CurveType>('smooth');
  const [area, setArea] = useState(false);
  const [includeZero, setIncludeZero] = useState(true);
  const [showEndValues, setShowEndValues] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showValueAxis, setShowValueAxis] = useState(true);
  const [showCategoryAxis, setShowCategoryAxis] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [legend, setLegend] = useState<LegendMode>('auto');
  const [height, setHeight] = useState(280);
  const [pointRadius, setPointRadius] = useState(3);
  const [label, setLabel] = useState('Ciudadanos atendidos por jornada');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const { categories, chartSeries } = matrix;

  const code = useMemo(() => {
    const props = ['categories={categories}', 'series={series}'];
    if (curve !== 'smooth') props.push(`curve="${curve}"`);
    if (area) props.push('area');
    if (!includeZero) props.push('includeZero={false}');
    if (showEndValues) props.push('showEndValues');
    if (!showGrid) props.push('showGrid={false}');
    if (!showValueAxis) props.push('showValueAxis={false}');
    if (!showCategoryAxis) props.push('showCategoryAxis={false}');
    if (showTable) props.push('showTable');
    if (legend !== 'auto') props.push(`showLegend={${legend}}`);
    if (height !== 280) props.push(`height={${height}}`);
    if (pointRadius !== 3) props.push(`pointRadius={${pointRadius}}`);
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onPointClick={onPointClick}');
    return snippet(
      [constLine('categories', categories), constLine('series', chartSeries)],
      jsx('LineChart', props),
    );
  }, [
    categories,
    chartSeries,
    curve,
    area,
    includeZero,
    showEndValues,
    showGrid,
    showValueAxis,
    showCategoryAxis,
    showTable,
    legend,
    height,
    pointRadius,
    label,
    locale,
    format,
    loading,
  ]);

  const onPointClick = (e: ChartPointEvent) =>
    setLastEvent({
      name: 'onPointClick',
      summary: (
        <>
          <strong>{e.category}</strong> · {e.series} = {e.value}
        </>
      ),
    });

  return (
    <SandboxLayout
      data={<MatrixEditor state={matrix} />}
      options={
        <>
          <SelectField label="Curva" value={curve} options={CURVES} onChange={setCurve} />
          <SelectField label="Leyenda" value={legend} options={LEGEND_MODES} onChange={setLegend} />
          <Check label="Área" checked={area} onChange={setArea} />
          <Check label="Incluir cero" checked={includeZero} onChange={setIncludeZero} />
          <Check label="Valores finales" checked={showEndValues} onChange={setShowEndValues} />
          <Check label="Grilla" checked={showGrid} onChange={setShowGrid} />
          <Check label="Eje de valores" checked={showValueAxis} onChange={setShowValueAxis} />
          <Check
            label="Eje de categorías"
            checked={showCategoryAxis}
            onChange={setShowCategoryAxis}
          />
          <Check label="Tabla espejo" checked={showTable} onChange={setShowTable} />
          <Check label="Cargando" checked={loading} onChange={setLoading} />
          <Check label="Sin datos" checked={empty} onChange={setEmpty} />
          <RangeField
            label="Alto"
            value={height}
            min={160}
            max={480}
            step={20}
            unit="px"
            onChange={setHeight}
          />
          <RangeField
            label="Radio de punto"
            value={pointRadius}
            min={0}
            max={8}
            unit="px"
            onChange={setPointRadius}
          />
          <TextField label="Etiqueta accesible (label)" value={label} onChange={setLabel} wide />
          <LocaleFormatFields
            locale={locale}
            onLocale={setLocale}
            format={format}
            onFormat={setFormat}
          />
        </>
      }
      code={code}
      chart={
        <LineChart
          categories={categories}
          series={empty ? NO_DATA : chartSeries}
          curve={curve}
          area={area}
          includeZero={includeZero}
          showEndValues={showEndValues}
          showGrid={showGrid}
          showValueAxis={showValueAxis}
          showCategoryAxis={showCategoryAxis}
          showTable={showTable}
          showLegend={legendValue(legend)}
          height={height}
          pointRadius={pointRadius}
          loading={loading}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format)}
          onPointClick={onPointClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita los números del panel y el gráfico se actualiza al instante. Clic en un punto para
          ver <code>onPointClick</code>.
        </>
      }
    />
  );
}
