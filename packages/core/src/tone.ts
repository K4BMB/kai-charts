import { seriesColor } from './palette.js';

/** Semantic tone used by trends, progress bars and status chips. */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_FALLBACK: Record<Exclude<Tone, 'neutral'>, string> = {
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#0ea5e9',
};

/**
 * CSS color for a tone: `var(--kc-<tone>, fallback)` so the app theme wins. A custom color
 * takes precedence; `neutral` maps to the first palette color.
 */
export function toneColor(tone: Tone = 'neutral', custom?: string): string {
  if (custom) return custom;
  if (tone === 'neutral') return seriesColor(0);
  return `var(--kc-${tone}, ${TONE_FALLBACK[tone]})`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
