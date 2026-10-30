import { ValueFormat } from 'kai-charts';

/** Keys of the "Formato" select shared by every sandbox that formats numbers. */
export type FormatKey = 'number' | 'percent' | 'currency' | 'compact';

export const FORMATS: Record<FormatKey, Intl.NumberFormatOptions> = {
  number: {},
  percent: { style: 'percent', maximumFractionDigits: 0 },
  currency: { style: 'currency', currency: 'VES', maximumFractionDigits: 0 },
  compact: { notation: 'compact' },
};

export const FORMAT_OPTIONS: readonly { value: FormatKey; label: string }[] = [
  { value: 'number', label: 'Número' },
  { value: 'percent', label: 'Porcentaje' },
  { value: 'currency', label: 'Moneda VES' },
  { value: 'compact', label: 'Compacto' },
];

export const LOCALES: readonly string[] = ['es-VE', 'en-US', 'pt-BR', 'de-DE'];
export const DEFAULT_LOCALE = 'es-VE';

/** `showLegend` of bar/line charts: `'auto'` (2+ series), always or never. */
export type LegendMode = 'auto' | 'true' | 'false';

export function legendValue(mode: LegendMode): boolean | 'auto' {
  return mode === 'auto' ? 'auto' : mode === 'true';
}

/** The `ValueFormat` a chart receives for a format key (`number` = component default). */
export function valueFormatFor(key: FormatKey): ValueFormat | undefined {
  return key === 'number' ? undefined : FORMATS[key];
}

/** `{ style: 'percent', maximumFractionDigits: 0 }` — an object literal valid in a template. */
export function formatLiteral(options: Intl.NumberFormatOptions): string {
  const entries = Object.entries(options).map(
    ([key, value]) => `${key}: ${typeof value === 'string' ? `'${value}'` : value}`,
  );
  return `{ ${entries.join(', ')} }`;
}
