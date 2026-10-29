/** Number of `--kc-color-N` tokens. Series beyond that cycle through the palette. */
export const KC_PALETTE_SIZE = 8;

/** Fallback colors used when the host app does not define `--kc-color-N`. */
export const KC_DEFAULT_PALETTE: readonly string[] = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#64748b',
];

/**
 * CSS color for a series: the custom color when given, otherwise
 * `var(--kc-color-N, fallback)` so the app theme wins and the default still renders.
 */
export function seriesColor(index: number, custom?: string): string {
  if (custom) return custom;
  const i = ((index % KC_PALETTE_SIZE) + KC_PALETTE_SIZE) % KC_PALETTE_SIZE;
  return `var(--kc-color-${i + 1}, ${KC_DEFAULT_PALETTE[i]})`;
}
