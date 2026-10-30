import { numberAttribute } from '@angular/core';

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
