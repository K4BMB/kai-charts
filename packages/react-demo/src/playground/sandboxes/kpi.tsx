import { useMemo, useState } from 'react';
import { KpiCard } from 'kai-charts-react';
import { KpiIcon } from '../../kpi-icon';
import { KPIS } from '../../sample-data';
import { Check, ColorField, LocaleFormatFields, NumberField, TextField } from '../fields';
import { SandboxLayout } from '../sandbox-layout';
import { defaultColor, formatProps, jsx, resolveFormat, type FormatKey } from '../shared';

const SAMPLE = KPIS[0];

/** KPI card sandbox: plain fields instead of rows; the card sits in a 320 px box. */
export function KpiSandbox() {
  const [label, setLabel] = useState(SAMPLE.label);
  const [value, setValue] = useState<number | null>(
    typeof SAMPLE.value === 'number' ? SAMPLE.value : null,
  );
  const [subtext, setSubtext] = useState(SAMPLE.subtext ?? '');
  const [trend, setTrend] = useState<number | null>(SAMPLE.trend ?? null);

  const [invertTrend, setInvertTrend] = useState(false);
  const [color, setColor] = useState('');
  const [locale, setLocale] = useState('es-VE');
  const [format, setFormat] = useState<FormatKey>('number');
  const [loading, setLoading] = useState(false);

  const code = useMemo(() => {
    const props = [`label="${label}"`, `value={${value ?? 0}}`];
    if (subtext) props.push(`subtext="${subtext}"`);
    if (trend !== null) props.push(`trend={${trend}}`);
    if (invertTrend) props.push('invertTrend');
    if (color) props.push(`color="${color}"`);
    props.push(...formatProps(locale, format));
    if (loading) props.push('loading');
    props.push('icon={<CalendarIcon />}');
    return jsx('KpiCard', props);
  }, [label, value, subtext, trend, invertTrend, color, locale, format, loading]);

  return (
    <SandboxLayout
      data={
        <div className="options">
          <TextField label="Etiqueta (label)" value={label} onChange={setLabel} wide />
          <NumberField label="Valor" value={value} onChange={setValue} />
          <NumberField
            label="Tendencia (razón)"
            value={trend}
            placeholder="ninguna"
            onChange={setTrend}
          />
          <TextField
            label="Texto secundario (subtext)"
            value={subtext}
            onChange={setSubtext}
            wide
          />
        </div>
      }
      options={
        <>
          <Check label="Tendencia invertida" checked={invertTrend} onChange={setInvertTrend} />
          <Check label="Cargando" checked={loading} onChange={setLoading} />
          <ColorField
            label="Color del icono"
            value={color}
            fallback={defaultColor(0)}
            onChange={setColor}
          />
          <LocaleFormatFields
            locale={locale}
            onLocale={setLocale}
            format={format}
            onFormat={setFormat}
          />
        </>
      }
      code={code}
      cardClassName="kpi-box"
      chart={
        <KpiCard
          label={label}
          value={value ?? 0}
          subtext={subtext}
          trend={trend ?? undefined}
          invertTrend={invertTrend}
          color={color || undefined}
          locale={locale}
          valueFormat={resolveFormat(format)}
          loading={loading}
          icon={<KpiIcon name="calendar" />}
        />
      }
      lastEvent={null}
      hint={
        <>
          Edita los campos del panel y la tarjeta se actualiza al instante. <code>KpiCard</code> no
          emite eventos.
        </>
      }
    />
  );
}
