# Component contract (shared by the Angular and React renderers)

Every component is implemented twice (Angular `Kc*`, React function component) on top of the same
`kai-charts-core` helpers and the same `.kc-*` CSS. **This document is the source of truth for the
DOM, class names, props and behaviour**; both renderers must produce the same markup so one
stylesheet serves both and the demos look identical.

Conventions that apply to every component:

- Root element gets `kc-chart kc-<component>` (Angular: `host: { class }`; React: `className` on
  the root `div`, plus the user's `className`). React also accepts `style`.
- Inputs mirror 1:1: Angular `input()`/`output()`, React props (events as `onXxx`). Booleans use
  `booleanAttribute` in Angular so `<kc-x stacked />` works; numbers use `numberAttribute`.
- Defaults for `locale`, `emptyText`, `loadingText`, `categoryHeader` come from the global config
  (`KC_CONFIG` / `KaiChartsProvider`) → `KC_DEFAULTS` of the core.
- Numbers are formatted with `createValueFormatter(locale, valueFormat)` from the core; never
  with `toLocaleString` directly.
- `loading` replaces the content by a skeleton (`role="status" aria-busy="true"`); an empty data
  set shows `<kc-chart-state kind="empty">` / `<ChartState kind="empty">` with `emptyText`.
- Colors never hardcoded in markup: use the strings returned by the core (`seriesColor`,
  `toneColor`) as inline styles or `--kc-row-color` custom properties.
- Interactive rows/points: `tabindex="0"`, `aria-label`, Enter/Space trigger the click handler
  (`preventDefault` on keys), clickable class only when a handler is attached.
- Stylesheets live in `packages/core/styles/<component>.css`; Angular inlines them with
  `styles: "@import 'kai-charts-core/styles/<component>.css';"` + `ViewEncapsulation.None`; React
  imports them in `packages/react/src/styles.css`.
- Tests mirror each other (Angular `*.spec.ts` with TestBed, React `*.spec.tsx` with Testing
  Library) and cover the cases listed under each component.

---

## Trend chip (shared fragment, not a component)

Produced from `describeTrend(value, locale, format?, invert?)` → `{ text, direction, tone }`.

```html
<span class="kc-trend kc-trend--up kc-tone--success">
  <svg
    class="kc-trend__arrow"
    viewBox="0 0 12 12"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 9 9 3M4.5 3H9v4.5" />
  </svg>
  <span>+12%</span>
</span>
```

- Modifier `kc-trend--<direction>` (`up` | `down` | `flat`) and `kc-tone--<tone>`
  (`success` | `danger` | `neutral`). The CSS rotates the arrow for `down`; for `flat` render the
  same markup (muted color).

---

## KPI card — `kc-kpi-card` / `KpiCard`

| Input / prop  | Type                                                                                                                  | Default           | Notes                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| `label`       | `string`                                                                                                              | —                 | Required                                        |
| `value`       | `number \| string`                                                                                                    | —                 | Numbers formatted; strings rendered as-is       |
| `subtext`     | `string`                                                                                                              | `''`              | Secondary line (`en el período`)                |
| `trend`       | `number`                                                                                                              | —                 | Variation (ratio by default, see `trendFormat`) |
| `trendFormat` | `ValueFormat`                                                                                                         | `KC_TREND_FORMAT` | Intl options or function for the trend          |
| `invertTrend` | `boolean`                                                                                                             | `false`           | Down is good (costs, incidents)                 |
| `valueFormat` | `ValueFormat`                                                                                                         | —                 |                                                 |
| `locale`      | `string`                                                                                                              | config            |                                                 |
| `color`       | `string`                                                                                                              | —                 | Accent for the icon circle (`--kc-kpi-accent`)  |
| `loading`     | `boolean`                                                                                                             | `false`           | Skeleton                                        |
| icon          | Angular: `<ng-content select="[kcIcon]">` (export directive `KcIcon`, selector `[kcIcon]`); React: `icon?: ReactNode` | —                 | Wrapper rendered only when an icon exists       |

DOM:

```html
<div class="kc-chart kc-kpi" style="--kc-kpi-accent: <color>">
  <!-- style only when color given; add kc-kpi--loading when loading -->
  <div class="kc-kpi__icon" aria-hidden="true">…projected svg…</div>
  <!-- only with icon -->
  <div class="kc-kpi__body">
    <div class="kc-kpi__label">Jornadas ejecutadas</div>
    <div class="kc-kpi__value">128</div>
    <div class="kc-kpi__meta">
      <!-- only when trend or subtext -->
      <span class="kc-trend …">…</span>
      <!-- only when trend is a number -->
      <span class="kc-kpi__subtext">vs período anterior</span>
      <!-- only when subtext -->
    </div>
  </div>
</div>
```

Loading: same structure with `kc-kpi--loading` on the root, `role="status" aria-busy="true"` on
the root, label/value/meta texts replaced by non-breaking spaces (the CSS paints skeleton blocks).

Tests (both renderers):

1. renders label, formatted value (`40415` → `40.415` with es-VE) and subtext;
2. renders a string value verbatim (`'Bs. 386,40'`);
3. `trend=0.12` → `.kc-trend.kc-trend--up.kc-tone--success` with text `+12%`;
4. `trend=-0.05 invertTrend` → `.kc-tone--success`; `trend=-0.05` alone → `.kc-tone--danger`;
5. no trend and no subtext → no `.kc-kpi__meta`;
6. icon provided → `.kc-kpi__icon` exists; absent otherwise;
7. `color="#b45309"` → root style contains `--kc-kpi-accent`;
8. `loading` → root has `aria-busy="true"` and `.kc-kpi--loading`.

---

## Progress list — `kc-progress-list` / `ProgressList`

Core: `buildProgressRows(items, format, max?)` → `ProgressRowView[]`.

| Input / prop  | Type                                                   | Default | Notes                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `items`       | `ProgressItem[]`                                       | `[]`    | `{ label, value, max?, tone?, color?, caption?, valueText? }`                                                                                                                                                      |
| `max`         | `number`                                               | —       | List maximum (default: largest value)                                                                                                                                                                              |
| `showValues`  | `boolean`                                              | `true`  |                                                                                                                                                                                                                    |
| `valueFormat` | `ValueFormat`                                          | —       |                                                                                                                                                                                                                    |
| `locale`      | `string`                                               | config  |                                                                                                                                                                                                                    |
| `label`       | `string`                                               | `''`    | `aria-label` of the list                                                                                                                                                                                           |
| `loading`     | `boolean`                                              | `false` |                                                                                                                                                                                                                    |
| `emptyText`   | `string`                                               | config  |                                                                                                                                                                                                                    |
| event         | `itemClick` / `onItemClick(item: ProgressItem, index)` | —       | Rows become focusable/clickable only when attached (React: prop defined; Angular: always attach handlers, add the clickable class when `itemClick` has observers — simpler: always clickable/focusable in Angular) |

DOM:

```html
<ul class="kc-chart kc-progress" role="list" aria-label="…">
  <li
    class="kc-progress__item kc-tone--danger [kc-progress__item--clickable]"
    style="--kc-row-color: var(--kc-danger, #dc2626)"
    tabindex="0"
    aria-label="Amazonas: 1,7"
  >
    <div class="kc-progress__head">
      <span class="kc-progress__dot" aria-hidden="true"></span>
      <span class="kc-progress__label">Amazonas</span>
      <span class="kc-progress__value">1,7</span>
      <!-- only when showValues -->
    </div>
    <div
      class="kc-progress__track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="21.3"
      aria-valuenow="1.7"
      aria-label="Amazonas: 1,7"
    >
      <div class="kc-progress__bar" style="width: 7.98%"></div>
    </div>
    <div class="kc-progress__caption">Desatendida · 280 trámites</div>
    <!-- only when caption -->
  </li>
</ul>
```

Loading → `<kc-chart-state kind="loading" [height]="items().length * 56 || 160">` (React same
numbers). Empty (`items.length === 0`) → `kind="empty"` with `emptyText`, height 120.

Tests:

1. renders one `li` per item with label, value and caption;
2. bar widths relative to the largest value (`21.3` → `100%`, `1.7` → `7.98%`), `max` input respected;
3. tone class and `--kc-row-color` from the core (`var(--kc-danger, #dc2626)`), custom `color` wins;
4. `role="progressbar"` with `aria-valuenow`/`aria-valuemax`;
5. `showValues=false` hides `.kc-progress__value`;
6. empty → `.kc-state--empty`; loading → `[aria-busy="true"]`;
7. click and Enter on a row emit `(item, index)`.

---

## Ranking list — `kc-ranking-list` / `RankingList`

Core: `buildRankingRows(items, format, { limit, sort })` → `RankingRowView[]`.

| Input / prop  | Type                                                  | Default | Notes                                          |
| ------------- | ----------------------------------------------------- | ------- | ---------------------------------------------- |
| `items`       | `RankingItem[]`                                       | `[]`    | `{ id?, label, sublabel?, value, color? }`     |
| `limit`       | `number`                                              | —       | Top N                                          |
| `sort`        | `'desc' \| 'asc' \| 'none'`                           | `desc`  |                                                |
| `showBars`    | `boolean`                                             | `true`  |                                                |
| `showRank`    | `boolean`                                             | `true`  |                                                |
| `valueFormat` | `ValueFormat`                                         | —       |                                                |
| `locale`      | `string`                                              | config  |                                                |
| `label`       | `string`                                              | `''`    | `aria-label`                                   |
| `loading`     | `boolean`                                             | `false` |                                                |
| `emptyText`   | `string`                                              | config  |                                                |
| event         | `itemClick` / `onItemClick(item: RankingItem, index)` | —       | `item` is the ORIGINAL item (find by id/label) |

DOM:

```html
<ol class="kc-chart kc-ranking" aria-label="…">
  <li
    class="kc-ranking__item kc-ranking__item--first [kc-ranking__item--clickable]"
    style="--kc-row-color: var(--kc-color-1, #2563eb)"
    tabindex="0"
    aria-label="1. Zulia: 5.260"
  >
    <span class="kc-ranking__rank" aria-hidden="true">1</span>
    <!-- only when showRank -->
    <div class="kc-ranking__body">
      <div class="kc-ranking__head">
        <span class="kc-ranking__label">Zulia</span>
        <span class="kc-ranking__sublabel">UM-ZUL-02</span>
        <!-- only when sublabel -->
        <span class="kc-ranking__value">5.260</span>
      </div>
      <div class="kc-ranking__track" aria-hidden="true">
        <!-- only when showBars -->
        <div class="kc-ranking__bar" style="width: 100%"></div>
      </div>
    </div>
  </li>
</ol>
```

`kc-ranking__item--first` only on rank 1. Loading/empty like the progress list (row height 52).

Tests:

1. sorts descending by default and numbers ranks 1..N; `sort="none"` keeps the input order;
2. `limit=5` renders 5 of 7 items;
3. bar widths relative to the first row (second row `93.92%`);
4. first row has `kc-ranking__item--first`, others not;
5. value formatted with es-VE (`5.260`); sublabel rendered when present;
6. `showBars=false` → no `.kc-ranking__track`; `showRank=false` → no `.kc-ranking__rank`;
7. click/Enter emit the original item and index;
8. empty → `.kc-state--empty`; loading → `[aria-busy="true"]`.

---

## Showcase additions (both demos, same wording)

Restructure the showcase page into titled blocks, in this order:

1. **Indicadores** — a responsive grid (`repeat(auto-fit, minmax(260px, 1fr))`, each KPI inside a
   `.card`) with the six KPIs below. The demo-level checkboxes "Cargando" applies to them too.
2. **Barras** — the existing six bar-chart cards, unchanged.
3. **Listas** — two cards side by side: "Densidad de atención por región" (hint: `Atenciones por
1.000 habitantes · semáforo decidido por el presenter`) with the progress list, and
   "Ciudadanos atendidos por estado" (hint: `Top 5 · últimos 6 meses`) with the ranking list
   (`limit=5`). "Sin datos" checkbox → pass `[]`; "Cargando" → `loading`.

Block markup: `<section class="block"><h2 class="block__title">Indicadores</h2>…</section>`;
`.block + .block { margin-top: 28px }`, `.block__title { font-size: 1.15rem; margin: 0 0 12px }`.

Sample data to add to `sample-data.ts` (identical in both demos):

```ts
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

export const CITIZENS_BY_STATE: RankingItem[] = [
  { id: 'VE-V', label: 'Zulia', value: 5260 },
  { id: 'VE-M', label: 'Miranda', value: 4940 },
  { id: 'VE-A', label: 'Distrito Capital', value: 3830 },
  { id: 'VE-G', label: 'Carabobo', value: 3540 },
  { id: 'VE-K', label: 'Lara', value: 3390 },
  { id: 'VE-B', label: 'Anzoátegui', value: 2980 },
  { id: 'VE-F', label: 'Bolívar', value: 2340 },
];
```

Icons for the KPI cards (hand-drawn, no license concerns). All share
`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`:

| icon        | inner markup                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `calendar`  | `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>`                                                        |
| `file`      | `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>`                                                         |
| `users`     | `<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5a5 5 0 0 1 6 5"/>` |
| `user-plus` | `<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6"/>`                                                     |
| `card`      | `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>`                                                              |
| `alert`     | `<path d="M12 4 2.5 20h19L12 4z"/><path d="M12 10v4M12 17.5v.5"/>`                                                                          |

Angular: a small demo component `app-kpi-icon [name]` with a `@switch` renders them; React: a
`KpiIcon({ name })` component. In the KPI card: Angular `<svg kcIcon …>` is awkward through a
wrapper component, so project the demo component itself: `<app-kpi-icon kcIcon [name]="k.icon" />`
(the `kcIcon` attribute on the host is what the `select="[kcIcon]"` slot needs; the inner svg must
be `display:block`). React: `icon={<KpiIcon name={k.icon} />}`.

---

## Planned next (not in this wave)

`kc-venezuela-map` / `VenezuelaMap` (core geometry in progress), `kc-line-chart`, `kc-ring-chart`,
`kc-ranking-table`, `kc-month-calendar`, bar-chart options (`showValueAxis`, `barWidth`,
rounded stack tops, gradient fill). Each will get its own section here before implementation.
