/** Average glyph width relative to the font size (sans-serif, mixed case). */
const GLYPH_RATIO = 0.6;

/** Rough text width in px. SVG text cannot be measured before it is rendered. */
export function estimateTextWidth(text: string, fontSize = 12): number {
  return text.length * fontSize * GLYPH_RATIO;
}

/** Cuts a label with an ellipsis when its estimated width exceeds `maxWidth`. */
export function truncateLabel(text: string, maxWidth: number, fontSize = 12): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text;
  const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * GLYPH_RATIO)) - 1);
  return text.slice(0, maxChars).trimEnd() + '…';
}

/** Rounds to 2 decimals to keep SVG attributes short and stable. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
