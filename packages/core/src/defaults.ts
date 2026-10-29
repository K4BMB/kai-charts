/** Framework-agnostic defaults shared by every renderer (Angular, React). */
export interface KaiChartsDefaults {
  /** BCP 47 locale used by `Intl.NumberFormat` for axes, labels and tables. */
  locale: string;
  /** Text shown by the empty state when a chart receives no data. */
  emptyText: string;
  /** Text announced to assistive technology while a chart is loading. */
  loadingText: string;
  /** Header of the category column in the mirror table. */
  categoryHeader: string;
}

export const KC_DEFAULTS: KaiChartsDefaults = {
  locale: 'es-VE',
  emptyText: 'Sin datos',
  loadingText: 'Cargando…',
  categoryHeader: 'Categoría',
};
