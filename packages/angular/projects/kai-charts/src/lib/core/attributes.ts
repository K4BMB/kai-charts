import { booleanAttribute, numberAttribute } from '@angular/core';

/**
 * `numberAttribute` for optional numeric inputs (`trend`, `max`, `limit`): keeps `undefined`
 * for missing or unparseable values instead of `NaN`, so `<kc-x limit="5" />` and
 * `[limit]="undefined"` both work.
 */
export function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** `showLegend` accepts `true`, `false` or `'auto'` (legend only when there are 2+ series). */
export function legendAttribute(value: unknown): boolean | 'auto' {
  return value === 'auto' || value === undefined ? 'auto' : booleanAttribute(value);
}
