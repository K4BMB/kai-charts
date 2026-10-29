import { InjectionToken, Provider } from '@angular/core';

/** Global defaults shared by every chart. Override with `provideKaiCharts()`. */
export interface KaiChartsConfig {
  /** BCP 47 locale used by `Intl.NumberFormat` for axes, labels and tables. */
  locale: string;
  /** Text shown by the empty state when a chart receives no data. */
  emptyText: string;
  /** Text announced to assistive technology while a chart is loading. */
  loadingText: string;
  /** Header of the category column in the mirror table. */
  categoryHeader: string;
}

export const KC_DEFAULT_CONFIG: KaiChartsConfig = {
  locale: 'es-VE',
  emptyText: 'Sin datos',
  loadingText: 'Cargando…',
  categoryHeader: 'Categoría',
};

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
