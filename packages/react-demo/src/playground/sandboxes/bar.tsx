import { useMemo, useState } from 'react';
import { BarChart, type ChartPointEvent, type Orientation } from 'kai-charts-react';
import { NO_DATA, PROCEDURES_BY_DAY } from '../../sample-data';
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

const ORIENTATIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
] as const;
const LEGEND_MODES = [
  { value: 'auto', label: 'Automática' },
  { value: 'true', label: 'Siempre' },
  { value: 'false', label: 'Nunca' },
] as const;

/** Bar chart sandbox: the original playground, now one of nine. */
export function BarSandbox() {
  const matrix = useMatrixData(PROCEDURES_BY_DAY);

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
  const [barWidth, setBarWidth] = useState(0.7);
  const [showValueAxis, setShowValueAxis] = useState(true);
  const [showCategoryAxis, setShowCategoryAxis] = useState(true);
  const [roundStackTop, setRoundStackTop] = useState(false);
  const [label, setLabel] = useState('Trámites por día de jornada');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);

  const { categories, chartSeries } = matrix;

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
    if (barWidth !== 0.7) props.push(`barWidth={${barWidth}}`);
    if (!showValueAxis) props.push('showValueAxis={false}');
    if (!showCategoryAxis) props.push('showCategoryAxis={false}');
    if (roundStackTop) props.push('roundStackTop');
    if (label) props.push(`label="${label}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('onBarClick={onBarClick}');
    return snippet(
      [constLine('categories', categories), constLine('series', chartSeries)],
      jsx('BarChart', props),
    );
  }, [
    categories,
    chartSeries,
    orientation,
    stacked,
    showValues,
    showGrid,
    showTable,
    legend,
    height,
    barRadius,
    barWidth,
    showValueAxis,
    showCategoryAxis,
    roundStackTop,
    label,
    locale,
    format,
    loading,
  ]);

  const onBarClick = (e: ChartPointEvent) =>
    setLastEvent({
      name: 'onBarClick',
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
          <SelectField
            label="Orientación"
            value={orientation}
            options={ORIENTATIONS}
            onChange={setOrientation}
          />
          <SelectField label="Leyenda" value={legend} options={LEGEND_MODES} onChange={setLegend} />
          <Check label="Apilado" checked={stacked} onChange={setStacked} />
          <Check label="Valores" checked={showValues} onChange={setShowValues} />
          <Check label="Grilla" checked={showGrid} onChange={setShowGrid} />
          <Check label="Eje de valores" checked={showValueAxis} onChange={setShowValueAxis} />
          <Check
            label="Eje de categorías"
            checked={showCategoryAxis}
            onChange={setShowCategoryAxis}
          />
          <Check label="Extremo redondeado" checked={roundStackTop} onChange={setRoundStackTop} />
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
            label="Radio de barra"
            value={barRadius}
            min={0}
            max={12}
            unit="px"
            onChange={setBarRadius}
          />
          <RangeField
            label="Ancho de barra"
            value={barWidth}
            min={0.1}
            max={1}
            step={0.05}
            onChange={setBarWidth}
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
        <BarChart
          categories={categories}
          series={empty ? NO_DATA : chartSeries}
          orientation={orientation}
          stacked={stacked}
          showValues={showValues}
          showGrid={showGrid}
          showTable={showTable}
          showLegend={legendValue(legend)}
          height={height}
          barRadius={barRadius}
          barWidth={barWidth}
          showValueAxis={showValueAxis}
          showCategoryAxis={showCategoryAxis}
          roundStackTop={roundStackTop}
          loading={loading}
          label={label}
          locale={locale}
          valueFormat={resolveFormat(format)}
          onBarClick={onBarClick}
        />
      }
      lastEvent={lastEvent}
      hint={
        <>
          Edita los números del panel y el gráfico se actualiza al instante. Clic en una barra para
          ver <code>onBarClick</code>.
        </>
      }
    />
  );
}
