import {
  CalendarEvent,
  CalendarKind,
  ChartSeries,
  MapDatum,
  MapMarker,
  ProgressItem,
  RankingItem,
  RingItem,
  TableColumn,
  TableRow,
  VENEZUELA_STATES,
} from 'kai-charts';

export interface BarSample {
  categories: string[];
  series: ChartSeries[];
}

export type KpiIcon = 'calendar' | 'file' | 'users' | 'user-plus' | 'card' | 'alert';

export interface KpiSample {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: number;
  invertTrend?: boolean;
  valueFormat?: Intl.NumberFormatOptions;
  icon: KpiIcon;
}

/** Indicadores de cabecera del tablero de jornadas. */
export const KPIS: KpiSample[] = [
  {
    label: 'Jornadas ejecutadas',
    value: 128,
    trend: 0.12,
    subtext: 'vs período anterior',
    icon: 'calendar',
  },
  { label: 'Actas emitidas / procesadas', value: 40415, subtext: 'en el período', icon: 'file' },
  { label: 'Ciudadanos atendidos', value: 31480, subtext: 'personas únicas', icon: 'users' },
  {
    label: 'Subregistro regularizado',
    value: 2946,
    subtext: 'personas formalizadas',
    icon: 'user-plus',
  },
  {
    label: 'Costo por trámite',
    value: 386.4,
    valueFormat: { style: 'currency', currency: 'VES', maximumFractionDigits: 2 },
    subtext: 'promedio operacional por acta',
    icon: 'card',
  },
  {
    label: 'Incidencias técnicas',
    value: 117,
    trend: -0.05,
    invertTrend: true,
    subtext: '0,9 por jornada',
    icon: 'alert',
  },
];

/** Atenciones por 1.000 habitantes; el semáforo (tone) lo decide el presenter. */
export const DENSITY: ProgressItem[] = [
  { label: 'Amazonas', value: 1.7, tone: 'danger', caption: 'Desatendida · 280 trámites' },
  { label: 'Delta Amacuro', value: 1.9, tone: 'danger', caption: 'Desatendida · 340 trámites' },
  { label: 'Bolívar', value: 4.1, tone: 'warning', caption: 'Cobertura baja · 2.340 trámites' },
  { label: 'Apure', value: 5.5, tone: 'warning', caption: 'Cobertura baja · 1.180 trámites' },
  {
    label: 'Miranda',
    value: 21.3,
    tone: 'success',
    caption: 'Cobertura adecuada · 6.840 trámites',
  },
];

/** Ciudadanos atendidos por estado (últimos 6 meses). */
export const CITIZENS_BY_STATE: RankingItem[] = [
  { id: 'VE-V', label: 'Zulia', value: 5260 },
  { id: 'VE-M', label: 'Miranda', value: 4940 },
  { id: 'VE-A', label: 'Distrito Capital', value: 3830 },
  { id: 'VE-G', label: 'Carabobo', value: 3540 },
  { id: 'VE-K', label: 'Lara', value: 3390 },
  { id: 'VE-B', label: 'Anzoátegui', value: 2980 },
  { id: 'VE-F', label: 'Bolívar', value: 2340 },
];

/** Ciudadanos atendidos por estado para el mapa (12 de 25 regiones con datos). */
export const CITIZENS_MAP: MapDatum[] = [
  { id: 'VE-V', value: 5260 },
  { id: 'VE-M', value: 4940 },
  { id: 'VE-A', value: 3830 },
  { id: 'VE-G', value: 3540 },
  { id: 'VE-K', value: 3390 },
  { id: 'VE-B', value: 2980 },
  { id: 'VE-F', value: 2340 },
  { id: 'VE-D', value: 2210 },
  { id: 'VE-S', value: 1870 },
  { id: 'VE-L', value: 1420 },
  { id: 'VE-I', value: 1310 },
  { id: 'VE-N', value: 1190 },
];

/**
 * Order in which the showcase map receives its data: the ranked states first, then the rest with
 * a deterministic value below the Top 5, so the ranking list next to the map stays truthful.
 */
export const ARRIVAL_SEQUENCE: MapDatum[] = [
  ...CITIZENS_MAP,
  ...VENEZUELA_STATES.filter((state) => !CITIZENS_MAP.some((d) => d.id === state.id)).map(
    (state, i) => ({ id: state.id, value: 800 + ((i * 731) % 2200) }),
  ),
];

/** Unidades móviles desplegadas (marcadores del mapa). */
export const MOBILE_UNITS: MapMarker[] = [
  { id: 'UM-ZUL-02', lat: 10.6427, lng: -71.6125, label: 'UM-ZUL-02 · Maracaibo', value: 14 },
  { id: 'UM-ZUL-05', lat: 10.3981, lng: -71.4451, label: 'UM-ZUL-05 · Cabimas', value: 9 },
  { id: 'UM-LAR-04', lat: 10.0678, lng: -69.3467, label: 'UM-LAR-04 · Barquisimeto', value: 11 },
  { id: 'UM-CAR-04', lat: 10.162, lng: -68.0077, label: 'UM-CAR-04 · Valencia', value: 11 },
  { id: 'UM-ARA-01', lat: 10.2469, lng: -67.5958, label: 'UM-ARA-01 · Maracay', value: 8 },
  { id: 'UM-DC-04', lat: 10.4806, lng: -66.9036, label: 'UM-DC-04 · Caracas', value: 10 },
  { id: 'UM-MIR-04', lat: 10.2442, lng: -66.5906, label: 'UM-MIR-04 · Los Teques', value: 13 },
  { id: 'UM-BOL-01', lat: 8.2906, lng: -62.7205, label: 'UM-BOL-01 · Puerto Ordaz', value: 7 },
  { id: 'UM-TAC-01', lat: 7.7669, lng: -72.225, label: 'UM-TAC-01 · San Cristóbal', value: 6 },
];

/** Ciudadanos atendidos por jornada: dos series mensuales para el gráfico de líneas. */
export const LINE_SAMPLE: BarSample = {
  categories: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'],
  series: [
    { name: 'Jornadas ejecutadas', data: [20, 22, 26, 24, 28, 31] },
    { name: 'Saldo fiscal', data: [48, 45, 43, 40, 38, 36] },
  ],
};

/** Atención nacional: anillos concéntricos (ratios). */
export const RINGS: RingItem[] = [
  { name: 'Saldo', value: 0.917 },
  { name: 'Emitidas', value: 0.942 },
  { name: 'Recibidas', value: 0.871 },
];

/** Tipos de evento del calendario de jornadas (leyenda y color de los puntos). */
export const CALENDAR_KINDS: CalendarKind[] = [
  { kind: 'done', name: 'Ejecutadas', tone: 'success' },
  { kind: 'pending', name: 'Pendientes', tone: 'info' },
  { kind: 'moved', name: 'Reprogramadas', tone: 'danger' },
];

/** Jornadas de octubre de 2026 (con dos días de septiembre visibles en la primera semana). */
export const CALENDAR_EVENTS: CalendarEvent[] = [
  { date: '2026-09-28', kind: 'done' },
  { date: '2026-09-30', kind: 'pending' },
  { date: '2026-10-02', kind: 'pending' },
  { date: '2026-10-05', kind: 'done', count: 2 },
  { date: '2026-10-07', kind: 'pending' },
  { date: '2026-10-09', kind: 'pending' },
  { date: '2026-10-12', kind: 'done' },
  { date: '2026-10-14', kind: 'pending' },
  { date: '2026-10-16', kind: 'pending' },
  { date: '2026-10-19', kind: 'done' },
  { date: '2026-10-21', kind: 'pending' },
  { date: '2026-10-23', kind: 'pending' },
  { date: '2026-10-23', kind: 'moved' },
  { date: '2026-10-26', kind: 'done' },
  { date: '2026-10-28', kind: 'pending' },
  { date: '2026-10-30', kind: 'pending' },
];

/** Columnas del ranking de eficiencia por unidad móvil. */
export const RANKING_TABLE_COLUMNS: TableColumn[] = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => `${v} min` },
  { key: 'days', header: 'Jornadas' },
];

/** Producción y tiempo medio de atención por unidad móvil. */
export const RANKING_TABLE_ROWS: TableRow[] = [
  {
    id: 'VE-V',
    label: 'Zulia',
    sublabel: 'UM-ZUL-02',
    values: { procedures: 4620, avg: 18, days: 14 },
  },
  {
    id: 'VE-K',
    label: 'Lara',
    sublabel: 'UM-LAR-04',
    values: { procedures: 4019, avg: 21, days: 11 },
  },
  {
    id: 'VE-G',
    label: 'Carabobo',
    sublabel: 'UM-CAR-04',
    values: { procedures: 4355, avg: 22, days: 11 },
  },
  {
    id: 'VE-M',
    label: 'Miranda',
    sublabel: 'UM-MIR-04',
    values: { procedures: 4290, avg: 23, days: 13 },
  },
  {
    id: 'VE-A',
    label: 'Dtto. Capital',
    sublabel: 'UM-DC-04',
    values: { procedures: 3980, avg: 27, days: 10 },
  },
];

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
