import { useEffect, useRef, useState } from 'react';
import { KC_DEFAULT_PALETTE, type ValueFormat } from 'kai-charts-react';

export type FormatKey = 'number' | 'percent' | 'currency' | 'compact';
export type LegendMode = 'auto' | 'true' | 'false';

export const FORMATS: Record<FormatKey, Intl.NumberFormatOptions> = {
  number: {},
  percent: { style: 'percent', maximumFractionDigits: 0 },
  currency: { style: 'currency', currency: 'VES', maximumFractionDigits: 0 },
  compact: { notation: 'compact' },
};

export const LOCALES = ['es-VE', 'en-US', 'pt-BR', 'de-DE'];
export const DEFAULT_LOCALE = 'es-VE';

export const randomInt = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));
/** 0–200: the range used by the matrix editor. */
export const random = (): number => randomInt(0, 200);
export const defaultColor = (index: number): string =>
  KC_DEFAULT_PALETTE[index % KC_DEFAULT_PALETTE.length];

/** Empty input → `null`; otherwise the number (or `null` when the text is not numeric). */
export function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function legendValue(mode: LegendMode): boolean | 'auto' {
  return mode === 'auto' ? 'auto' : mode === 'true';
}

/** The `valueFormat` prop: `undefined` when the chosen format is the component default. */
export function resolveFormat(format: FormatKey, defaultFormat: FormatKey = 'number') {
  return format === defaultFormat ? undefined : (FORMATS[format] as ValueFormat);
}

/** `locale`/`valueFormat` JSX props, only when they differ from the defaults. */
export function formatProps(
  locale: string,
  format: FormatKey,
  defaultFormat: FormatKey = 'number',
): string[] {
  const props: string[] = [];
  if (locale !== DEFAULT_LOCALE) props.push(`locale="${locale}"`);
  if (format !== defaultFormat) props.push(`valueFormat={${literal(FORMATS[format])}}`);
  return props;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const LINE_WIDTH = 80;

/**
 * JS literal of plain data (`{ name: 'Saldo', value: 0.917 }`): single quotes, unquoted keys,
 * `undefined` members skipped, wrapped over several lines when it would pass 80 columns
 * (Prettier-like). `column` is where the literal starts on its line.
 */
export function literal(value: unknown, indent = '', column = indent.length): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = `${indent}  `;
    const items = value.map((item) => literal(item, inner));
    return wrap('[', items, ']', indent, inner, column);
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, member]) => member !== undefined);
    if (entries.length === 0) return '{}';
    const inner = `${indent}  `;
    const items = entries.map(
      ([key, member]) => `${IDENTIFIER.test(key) ? key : literal(key)}: ${literal(member, inner)}`,
    );
    return wrap('{ ', items, ' }', indent, inner, column, '{', '}');
  }
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  return String(value);
}

function wrap(
  open: string,
  items: string[],
  close: string,
  indent: string,
  inner: string,
  column: number,
  multiOpen = open,
  multiClose = close,
): string {
  const oneLine = `${open}${items.join(', ')}${close}`;
  const fits = !items.some((item) => item.includes('\n')) && column + oneLine.length <= LINE_WIDTH;
  if (fits) return oneLine;
  return `${multiOpen}\n${items.map((item) => `${inner}${item}`).join(',\n')},\n${indent}${multiClose}`;
}

export function constLine(name: string, value: unknown): string {
  const prefix = `const ${name} = `;
  return `${prefix}${literal(value, '', prefix.length)};`;
}

/** `<Tag\n  prop\n  prop\n/>` (or `<Tag />` without props). */
export function jsx(tag: string, props: readonly string[]): string {
  if (props.length === 0) return `<${tag} />`;
  return `<${tag}\n  ${props.join('\n  ')}\n/>`;
}

/** Data constants followed by the element, separated by blank lines. */
export function snippet(consts: readonly string[], element: string): string {
  return [...consts, element].join('\n\n');
}

/** Clipboard helper with a short "¡Copiado!" feedback (1.5 s). */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = (text: string) => {
    try {
      void navigator.clipboard?.writeText(text).catch(() => undefined);
    } catch {
      // Clipboard unavailable (insecure context, permissions): the feedback still shows.
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };
  return [copied, copy];
}
