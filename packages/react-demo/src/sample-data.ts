import type { ChartSeries } from 'kai-charts-react';

export interface BarSample {
  categories: string[];
  series: ChartSeries[];
}

/** Trámites por tipo (catálogo `journey_procedures`). */
export const PROCEDURES_BY_TYPE: BarSample = {
  categories: [
    'Nacimiento',
    'Nacimiento NNA',
    'Matrimonio',
    'Unión estable de hecho',
    'Defunción',
    'Reconocimiento',
    'Rectificación',
    'Inserción',
  ],
  series: [{ name: 'Trámites', data: [148, 36, 22, 9, 31, 12, 7, 4] }],
};

/** Fase 1 de JEMA: el catálogo existe pero todavía no hay actas (todo en 0, eje real). */
export const PROCEDURES_BY_TYPE_PHASE_1: BarSample = {
  categories: PROCEDURES_BY_TYPE.categories,
  series: [{ name: 'Trámites', data: [0, 0, 0, 0, 0, 0, 0, 0] }],
};

/** Trámites por día de jornada: registrados vs. sincronizados. */
export const PROCEDURES_BY_DAY: BarSample = {
  categories: ['Lun 26', 'Mar 27', 'Mié 28', 'Jue 29', 'Vie 30', 'Sáb 31', 'Dom 1'],
  series: [
    { name: 'Registrados', data: [42, 58, 61, 47, 39, 18, 4] },
    { name: 'Sincronizados', data: [42, 58, 55, 31, 12, 0, 0] },
  ],
};

/** Estado del outbox por entidad: apilado. */
export const SYNC_STATE: BarSample = {
  categories: ['Actas', 'Ciudadanos', 'Reportes de estación', 'Incidencias'],
  series: [
    { name: 'Enviados', data: [198, 240, 36, 5], color: '#16a34a' },
    { name: 'Pendientes', data: [51, 60, 11, 2], color: '#f59e0b' },
    { name: 'Vencidos', data: [3, 0, 2, 0], color: '#94a3b8' },
    { name: 'Con error', data: [2, 1, 0, 1], color: '#dc2626' },
  ],
};

/** Ciudadanos atendidos por rango de edad. */
export const AGE_RANGE: BarSample = {
  categories: ['0–4', '5–11', '12–17', '18–29', '30–44', '45–59', '60+'],
  series: [{ name: 'Ciudadanos', data: [184, 23, 15, 61, 49, 27, 12] }],
};

/** Variación mensual de trámites (valores negativos, formato porcentual). */
export const MONTHLY_VARIATION: BarSample = {
  categories: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
  series: [{ name: 'Variación', data: [0.12, -0.08, 0.05, 0.21, -0.03, 0.09] }],
};

export const NO_DATA: ChartSeries[] = [{ name: 'Trámites', data: [] }];
