import { InjectionToken, Provider } from '@angular/core';
import { KC_DEFAULTS, KaiChartsDefaults } from 'kai-charts-core';

/** Global defaults shared by every chart. Override with `provideKaiCharts()`. */
export type KaiChartsConfig = KaiChartsDefaults;

export const KC_DEFAULT_CONFIG: KaiChartsConfig = KC_DEFAULTS;

export const KC_CONFIG = new InjectionToken<KaiChartsConfig>('KC_CONFIG', {
  providedIn: 'root',
  factory: () => KC_DEFAULT_CONFIG,
});

/**
 * Registers app-wide defaults for kai-charts.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideKaiCharts({ locale: 'en-US' })] });
 * ```
 */
export function provideKaiCharts(config: Partial<KaiChartsConfig>): Provider {
  return { provide: KC_CONFIG, useValue: { ...KC_DEFAULT_CONFIG, ...config } };
}
