import type { ReactNode } from 'react';
import { LOCALES, parseNumber, type FormatKey } from './shared';

/* Small controlled fields that render the playground's `.field` / `.check` markup. */

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  wide = false,
}: {
  label: ReactNode;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  wide?: boolean;
}) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Range slider whose label shows the current value (`Alto: 280 px`). */
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  valueText,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  /** Overrides the printed value (`auto`). */
  valueText?: string;
}) {
  return (
    <label className="field">
      {label}: {valueText ?? `${value}${unit ? ` ${unit}` : ''}`}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  wide = false,
  placeholder,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      {label}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** Number input where an empty value means `null` (component default / automatic). */
export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  step = 'any',
  min,
  max,
  wide = false,
}: {
  label: ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  step?: number | 'any';
  min?: number;
  max?: number;
  wide?: boolean;
}) {
  return (
    <label className={wide ? 'field wide' : 'field'}>
      {label}
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseNumber(e.target.value))}
      />
    </label>
  );
}

/** Color picker plus a free CSS text; empty text = automatic (`fallback` shown in the picker). */
export function ColorField({
  label,
  value,
  onChange,
  fallback,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  fallback: string;
}) {
  return (
    <label className="field">
      {label}
      <span className="color-field">
        <input
          type="color"
          value={value || fallback}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Selector de color"
        />
        <input
          type="text"
          className="color-text"
          value={value}
          placeholder="auto"
          onChange={(e) => onChange(e.target.value)}
          aria-label="Color (CSS, opcional)"
        />
      </span>
    </label>
  );
}

const LOCALE_OPTIONS: SelectOption<string>[] = LOCALES.map((locale) => ({
  value: locale,
  label: locale,
}));
const FORMAT_OPTIONS: SelectOption<FormatKey>[] = [
  { value: 'number', label: 'Número' },
  { value: 'percent', label: 'Porcentaje' },
  { value: 'currency', label: 'Moneda VES' },
  { value: 'compact', label: 'Compacto' },
];

/** `Locale` + `Formato` selects shared by every chart that formats numbers. */
export function LocaleFormatFields({
  locale,
  onLocale,
  format,
  onFormat,
}: {
  locale: string;
  onLocale: (locale: string) => void;
  format?: FormatKey;
  onFormat?: (format: FormatKey) => void;
}) {
  return (
    <>
      <SelectField label="Locale" value={locale} options={LOCALE_OPTIONS} onChange={onLocale} />
      {format !== undefined && onFormat && (
        <SelectField label="Formato" value={format} options={FORMAT_OPTIONS} onChange={onFormat} />
      )}
    </>
  );
}
