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

## Venezuela map — `kc-venezuela-map` / `VenezuelaMap`

Choropleth of the 23 states + Distrito Capital + Dependencias Federales that **fills in as data
arrives**: regions without a value stay grey, regions with data are painted with one color whose
opacity grows with the value (`buildMapModel` → `opacity` 0.18–1). Geometry ships in the core
(`VENEZUELA_STATES`, `VENEZUELA_CLAIM_ZONE`, `VENEZUELA_VIEWBOX` 800×614, Natural Earth, public
domain). Optional markers (mobile units) are projected with `projectVenezuela(lat, lng)`.

Core: `buildMapModel(data, markers, format, { highlight, emptyText, minOpacity })` → `MapModel`
(`regions`, `markers`, `legend`, `unmatched`, `filled`, `total`); `regionAnchor(region, width)`
gives the tooltip anchor in px; `normalizeRegionId()` accepts ISO codes or names.

| Input / prop                       | Type                                                                                          | Default                 | Notes                                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                             | `MapDatum[]`                                                                                  | `[]`                    | `{ id: 'VE-V' \| 'Zulia', value, label? }`                                                                                               |
| `markers`                          | `MapMarker[]`                                                                                 | `[]`                    | `{ id, lat, lng, label?, value?, color? }`                                                                                               |
| `color`                            | `string`                                                                                      | `seriesColor(0)`        | Fill color for regions with data                                                                                                         |
| `highlight`                        | `string \| string[]`                                                                          | `[]`                    | Ids (or names) drawn with a strong outline                                                                                               |
| `showLegend`                       | `boolean`                                                                                     | `true`                  | Gradient min→max + empty swatch + `filled/total`                                                                                         |
| `showLabels`                       | `boolean`                                                                                     | `false`                 | Short state names at their label points                                                                                                  |
| `showClaimZone`                    | `boolean`                                                                                     | `true`                  | Guayana Esequiba hatched (official VE depiction)                                                                                         |
| `claimZoneLabel`                   | `string`                                                                                      | `'Zona en Reclamación'` | Drawn only with `showLabels`                                                                                                             |
| `showTable`                        | `boolean`                                                                                     | `false`                 | Mirror table: state · value (all 25 regions)                                                                                             |
| `showCapitals`                     | `boolean`                                                                                     | `true`                  | Small dot on every state capital (24; Dependencias Federales has none); the capital name is added as a second tooltip row without swatch |
| `capitalHeader`                    | `string`                                                                                      | `'Capital'`             | Name of that tooltip row                                                                                                                 |
| `valueHeader`                      | `string`                                                                                      | `'Valor'`               | Table column header                                                                                                                      |
| `emptyText`                        | `string`                                                                                      | config                  | Tooltip/table text for regions without data                                                                                              |
| `minOpacity`                       | `number`                                                                                      | `0.18`                  |                                                                                                                                          |
| `label`                            | `string`                                                                                      | `''`                    | `aria-label` of the svg                                                                                                                  |
| `locale`, `valueFormat`, `loading` | as usual                                                                                      |                         |                                                                                                                                          |
| events                             | `regionClick` / `onRegionClick({ id, name, value })`, `markerClick` / `onMarkerClick(marker)` |                         |                                                                                                                                          |

DOM:

```html
<div class="kc-chart kc-map" style="--kc-map-fill: <color>; --kc-map-min: 18%">
  <div class="kc-plot">
    <svg class="kc-svg kc-map__svg" viewBox="0 0 800 614" role="group" aria-label="…">
      <defs>
        <pattern
          id="<unique per instance>"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect class="kc-map__hatch-bg" width="6" height="6" />
          <line class="kc-map__hatch-line" x1="0" y1="0" x2="0" y2="6" />
        </pattern>
      </defs>
      <path class="kc-map__claim" d="…" fill="url(#<id>)" />
      <!-- showClaimZone; drawn first -->
      <!-- regions: those without data first, with data next, highlighted last (so outlines stay visible) -->
      <path
        class="kc-map__region kc-map__region--empty"
        d="…"
        role="img"
        tabindex="0"
        aria-label="Lara: Sin datos"
        data-id="VE-K"
      />
      <path
        class="kc-map__region [kc-map__region--highlighted] [kc-map__region--clickable]"
        d="…"
        style="fill: <color>"
        fill-opacity="0.63"
        role="img"
        tabindex="0"
        aria-label="Zulia: 5.260"
        data-id="VE-V"
      />
      <text class="kc-map__label" x y>Zulia</text>
      <!-- showLabels, one per region, after all paths -->
      <text class="kc-map__claim-label" x y>Zona en Reclamación</text>
      <!-- showLabels && showClaimZone -->
      <circle class="kc-map__capital" cx cy r="3" aria-hidden="true" />
      <!-- showCapitals: one per region with a capital, after labels and before markers -->
      <g
        class="kc-map__marker [kc-map__marker--clickable]"
        transform="translate(x y)"
        style="--kc-marker-color: <color>"
        role="img"
        tabindex="0"
        aria-label="UM-ZUL-02: 14"
      >
        <circle class="kc-map__marker-halo" r="9" />
        <circle class="kc-map__marker-dot" r="4.5" />
      </g>
    </svg>
    <kc-tooltip /> <Tooltip />
    <!-- title = region/marker name, one row: value -->
  </div>
  <div class="kc-map__legend">
    <!-- showLegend && legend.visible -->
    <span class="kc-map__legend-min">0</span>
    <span class="kc-map__legend-bar"></span>
    <span class="kc-map__legend-max">5.260</span>
    <span class="kc-map__legend-empty"><i class="kc-map__legend-swatch"></i>Sin datos · 13/25</span>
  </div>
  <kc-chart-table … />
  <!-- showTable: categories = names, series = [{ name: valueHeader, data: values }] -->
</div>
```

Behaviour: hover/focus on a region or marker → tooltip anchored at `regionAnchor(region, width)`
(marker: its x/y scaled the same way), placement `mapTooltipPlacement(anchor.x, width)` (`right`
near the west edge, `left` near the east edge, `top` elsewhere), rows `[{ name: valueHeader, value: valueText, color }]`;
leave/blur hides it. Click, Enter, Space → `regionClick` with `{ id, name, value }` (value `null`
without data). `loading` → `kc-chart-state kind="loading"` with height `round(width × 614 / 800)`.
There is **no empty state**: an empty `data` array still draws the grey map (that is the point).
Width comes from `observeWidth` / `useContainerWidth`.

Tests (both renderers):

1. renders 25 `.kc-map__region` paths and the claim path; `showClaimZone=false` removes it;
2. regions without data have `kc-map__region--empty` and no inline fill; with data they carry
   `fill-opacity` (max value → `1`) and the fill color;
3. `highlight="Zulia"` → that path has `kc-map__region--highlighted` and is the last `path`;
4. tooltip on focus shows the name and formatted value (`Zulia` / `5.260`), hides on blur;
5. `regionClick` on click and Enter with `{ id: 'VE-V', name: 'Zulia', value: 5260 }`;
6. markers: one `g.kc-map__marker` per marker with `aria-label`, `markerClick` on click;
7. legend shows min/max texts and `filled/total` (`3/25`); hidden when no data or `showLegend=false`;
8. `showLabels` renders 25 `.kc-map__label` texts; `showTable` renders 25 rows;
9. `loading` → `[aria-busy="true"]` and no svg.

Showcase (both demos): block **Mapa** between _Indicadores_ and _Barras_: one wide card
"Ciudadanos atendidos por estado" with a two-column body (map 1.4fr · ranking list 1fr, stacking
under 760px). Map: `data = CITIZENS_MAP`, `markers = MOBILE_UNITS`, `highlight = top ranking id`,
`valueHeader="Ciudadanos"`, `label="Ciudadanos atendidos por estado"`. A button **Simular llegada
de datos** fills the remaining states one every 500 ms with random values 800–3.000 (so the
"se va llenando" behaviour is visible), and **Reiniciar** restores `CITIZENS_MAP`. The ranking
list shows `CITIZENS_BY_STATE` (`limit=5`). "Cargando" checkbox → `loading`; "Tabla espejo" →
`showTable`.

```ts
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
```

---

## Line chart — `kc-line-chart` / `LineChart`

Core: `computeLineLayout(options)` → `LineLayout` (`series[]` with `d`, `areaD`, `points[]`;
`gridLines`, `valueTicks`, `categoryTicks`, `axisLine`, `endLabels`, `baselineY`);
`categoryTooltip(series, categoryIndex, activeSeriesIndex, title, x, y, format)`.

| Input / prop                                                                            | Type                                           | Default    | Notes                                            |
| --------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | ------------------------------------------------ |
| `categories`, `series`                                                                  | as bar chart                                   |            | `null` values break the line (gap)               |
| `curve`                                                                                 | `'linear' \| 'smooth'`                         | `'smooth'` | smooth = monotone cubic, never overshoots        |
| `area`                                                                                  | `boolean`                                      | `false`    | Soft fill under each line (`fill-opacity` 0.12)  |
| `includeZero`                                                                           | `boolean`                                      | `true`     | `false` zooms the value axis into the data range |
| `height`                                                                                | `number`                                       | `280`      |                                                  |
| `showLegend`                                                                            | `boolean \| 'auto'`                            | `'auto'`   | Toggles series like the bar chart                |
| `showGrid`                                                                              | `boolean`                                      | `true`     |                                                  |
| `showValueAxis`                                                                         | `boolean`                                      | `true`     | `false` = the mockup look (no y axis)            |
| `showCategoryAxis`                                                                      | `boolean`                                      | `true`     |                                                  |
| `showEndValues`                                                                         | `boolean`                                      | `false`    | Last value of each series printed at its end     |
| `pointRadius`                                                                           | `number`                                       | `3`        | Points stay focusable even when tiny             |
| `showTable`, `loading`, `label`, `categoryHeader`, `emptyText`, `locale`, `valueFormat` | as bar chart                                   |            |                                                  |
| event                                                                                   | `pointClick` / `onPointClick(ChartPointEvent)` |            | click, Enter, Space on a point                   |

DOM (inside `.kc-chart.kc-line-chart > .kc-plot > svg.kc-svg[role=group][aria-label]`, same
skeleton/empty/legend/table wrappers as the bar chart):

```html
<line class="kc-grid" … />
<!-- showGrid -->
<text class="kc-tick" …>…</text>
<!-- value ticks, then category ticks (with <title>) -->
<line class="kc-axis" … />
<!-- baseline -->
<path class="kc-area" d="…" style="fill: <color>" data-series="0" />
<!-- area, per series, before the lines -->
<path class="kc-line" d="…" style="stroke: <color>" data-series="0" />
<!-- per series -->
<circle
  class="kc-point"
  cx
  cy
  r
  style="fill: <color>"
  data-series
  data-category
  role="img"
  tabindex="0"
  aria-label="May, S1: 10"
  …events
/>
<text class="kc-value" …>30</text>
<!-- endLabels -->
```

Tooltip: `categoryTooltip(visibleSeries, point.categoryIndex, point.seriesIndex, point.category, point.x, point.y, format)`.

Tests: (1) one `circle.kc-point` per finite value and one `path.kc-line` per series; (2) gaps split
the path (`d` contains two `M`); (3) `area` adds `path.kc-area`; (4) default curve emits `C`
commands, `curve="linear"` does not; (5) es-VE ticks; `showValueAxis=false` → no value ticks;
(6) `showEndValues` prints the last values; (7) empty/null data → empty state; loading → skeleton;
(8) legend auto + toggling hides a series' line and points; (9) `pointClick` payload on click and
Enter; (10) tooltip on focus with one row per series, hidden on blur.

Showcase card (block **Barras** renamed **Barras y líneas**): "Ciudadanos atendidos por jornada"
— two series `LINE_SAMPLE` (`Jornadas ejecutadas` 20,22,26,24,28,31 · `Actas por jornada (%)` no,
use `Saldo fiscal` 48,45,43,40,38,36 over May..Oct), `curve="smooth"`, `area`, `showEndValues`,
hint "Curva monótona (sin rebotes), área suave y valor final de cada serie".

---

## Ring chart — `kc-ring-chart` / `RingChart`

Core: `computeRingLayout({ size, items, format, thickness?, gap? })` → `RingLayout`
(`cx`, `cy`, `thickness`, `innerRadius`, `rings[]` with `r`, `circumference`, `dash`, `percent`,
`valueText`, `ariaLabel`, `color`).

| Input / prop                              | Type                                     | Default                                          | Notes                                |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| `items`                                   | `RingItem[]`                             | `[]`                                             | `{ name, value, max? (1), color? }`  |
| `size`                                    | `number`                                 | `200`                                            | viewBox side; rendered width ≤ size  |
| `thickness`, `gap`                        | `number`                                 | auto / `4`                                       |                                      |
| `centerLabel`                             | `string`                                 | `''`                                             | Small text above the center value    |
| `centerValue`                             | `number \| string`                       | —                                                | Numbers formatted with `valueFormat` |
| `centerTrend`                             | `number`                                 | —                                                | Trend chip under the value           |
| `invertTrend`                             | `boolean`                                | `false`                                          |                                      |
| `showLegend`                              | `boolean`                                | `true`                                           | Name + value per ring                |
| `valueFormat`                             | `ValueFormat`                            | `{ style: 'percent', maximumFractionDigits: 1 }` | Applied to `value`                   |
| `locale`, `label`, `loading`, `emptyText` | as usual                                 |                                                  |                                      |
| event                                     | `ringClick` / `onRingClick(item, index)` |                                                  |                                      |

DOM:

```html
<div class="kc-chart kc-ring">
  <div class="kc-ring__figure" style="max-width: 200px">
    <svg class="kc-svg kc-ring__svg" viewBox="0 0 200 200" role="group" aria-label="…">
      <!-- per ring, outer first -->
      <circle class="kc-ring__track" cx cy r stroke-width="<thickness>" style="stroke: <color>" />
      <circle
        class="kc-ring__arc [kc-ring__arc--empty]"
        cx
        cy
        r
        stroke-width="<thickness>"
        style="stroke: <color>"
        stroke-dasharray="<dash> <circumference>"
        transform="rotate(-90 cx cy)"
        role="img"
        tabindex="0"
        aria-label="Saldo: 91,7%"
        …events
      />
    </svg>
    <div class="kc-ring__center">
      <!-- when centerLabel/centerValue/centerTrend -->
      <div class="kc-ring__center-label">Saldo</div>
      <div class="kc-ring__center-value">91,7%</div>
      <span class="kc-trend …">…</span>
    </div>
    <kc-tooltip /> <Tooltip />
    <!-- anchored at (cx, cy - r) scaled to rendered width -->
  </div>
  <ul class="kc-ring__legend">
    <!-- showLegend -->
    <li class="kc-ring__legend-item">
      <i class="kc-ring__legend-swatch" style="background: <color>"></i
      ><span class="kc-ring__legend-name">Emitidas</span
      ><span class="kc-ring__legend-value">94,2%</span>
    </li>
  </ul>
</div>
```

`kc-ring__arc--empty` when `dash === 0`. Tooltip rows: `[{ name, value: valueText, color, active: true }]`.

Tests: (1) one track + one arc per ring, outer radius larger; (2) `stroke-dasharray` = dash and
circumference, full circle at ≥ 100 %; (3) zero → `kc-ring__arc--empty`; (4) center label/value/
trend rendered when given, absent otherwise; (5) legend with names and formatted percents,
hidden with `showLegend=false`; (6) `ringClick` on click/Enter with the item; (7) tooltip on
focus/blur; (8) empty → empty state; loading → skeleton.

Showcase card (block **Listas** renamed **Listas y anillos**): "Atención nacional" with
`RINGS = [{ name: 'Saldo', value: 0.917 }, { name: 'Emitidas', value: 0.942 }, { name: 'Recibidas', value: 0.871 }]`,
`centerLabel="Saldo"`, `centerValue={0.917}`, `centerTrend={0.038}`; hint "Anillos concéntricos
con valor central y leyenda con cifras (más legible que anillos sin etiqueta)".

---

## Bar chart additions (both renderers, same input names)

New inputs mapped straight to `computeBarLayout` options: `barWidth` (number, default 0.7),
`showValueAxis` (true), `showCategoryAxis` (true), `roundStackTop` (false). Nothing else changes;
existing tests stay valid. Add one test: `showValueAxis=false` renders no value ticks and the bars
start further left. Showcase: change the "Estado de sincronización" card hint to mention the new
options and use `roundStackTop barRadius="6"`; add nothing else.

---

## Month calendar — `kc-month-calendar` / `MonthCalendar`

Core: `buildMonthGrid(year, month, events, kinds, { weekStartsOn, today, selected, locale, weekdayFormat })`
→ `MonthGrid` (`title`, `weekdays[7]`, `weeks[6][7]` of `CalendarDayView`, `kinds[]` with totals,
`unknownKinds`); `shiftMonth(year, month, delta)`; `monthTitle()`.

| Input / prop        | Type                                                                                              | Default       | Notes                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `year`, `month`     | `number`                                                                                          | current month | `month` 1–12. Controlled: the host changes them on `monthChange`                                                                           |
| `events`            | `CalendarEvent[]`                                                                                 | `[]`          | `{ date: 'YYYY-MM-DD', kind, label?, count? }`                                                                                             |
| `kinds`             | `CalendarKind[]`                                                                                  | `[]`          | `{ kind, name, tone?, color? }` → legend + dot colors                                                                                      |
| `selected`          | `string`                                                                                          | —             | ISO date highlighted                                                                                                                       |
| `today`             | `string`                                                                                          | local today   | Override for tests/snapshots                                                                                                               |
| `weekStartsOn`      | `number`                                                                                          | `1`           | 0 = Sunday                                                                                                                                 |
| `showLegend`        | `boolean`                                                                                         | `true`        | Kinds with totals                                                                                                                          |
| `showNav`           | `boolean`                                                                                         | `true`        | Previous/next month buttons                                                                                                                |
| `footer`            | `string`                                                                                          | `''`          | Free text under the legend (`Cumplimiento: 89,3 %`), rendered with `<strong>` around the part after the colon by the host — here just text |
| `label`             | `string`                                                                                          | `''`          | `aria-label` of the grid table                                                                                                             |
| `locale`, `loading` | as usual                                                                                          |               |                                                                                                                                            |
| events              | `dayClick` / `onDayClick(day: CalendarDayView)`, `monthChange` / `onMonthChange({ year, month })` |               |                                                                                                                                            |

DOM:

```html
<div class="kc-chart kc-calendar">
  <div class="kc-calendar__head">
    <button type="button" class="kc-calendar__nav" aria-label="Mes anterior">
      ‹svg chevron-left›
    </button>
    <!-- showNav -->
    <h3 class="kc-calendar__title" aria-live="polite">octubre de 2026</h3>
    <button type="button" class="kc-calendar__nav" aria-label="Mes siguiente">
      ‹svg chevron-right›
    </button>
  </div>
  <table class="kc-calendar__grid" role="grid" aria-label="…">
    <thead>
      <tr>
        <th scope="col" class="kc-calendar__weekday" abbr="lunes">lun</th>
        …×7
      </tr>
    </thead>
    <tbody>
      <tr>
        <!-- ×6 -->
        <td class="kc-calendar__cell">
          <button
            type="button"
            class="kc-calendar__day [kc-calendar__day--outside] [kc-calendar__day--today] [kc-calendar__day--selected] [kc-calendar__day--weekend] [kc-calendar__day--clickable]"
            [aria-pressed]="isSelected"
            aria-label="lunes 5: 2 Ejecutadas"
            data-date="2026-10-05"
          >
            <span class="kc-calendar__number">5</span>
            <span class="kc-calendar__dots" aria-hidden="true">
              <i
                class="kc-calendar__dot [kc-calendar__dot--many]"
                style="--kc-dot-color: <color>"
              ></i>
              <!-- one per kind; --many when count > 1 -->
            </span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <ul class="kc-calendar__legend">
    <!-- showLegend && kinds.length -->
    <li class="kc-calendar__legend-item">
      <i class="kc-calendar__legend-swatch" style="background: <color>"></i>Ejecutadas
      <span class="kc-calendar__legend-total">3</span>
    </li>
  </ul>
  <p class="kc-calendar__footer">Cumplimiento: <strong>89,3 %</strong></p>
  <!-- footer: text before the first ':' plain, the rest in <strong>; whole text plain when no ':' -->
</div>
```

Chevrons: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>` (mirror `M6 3l5 5-5 5` for next).
Clicking nav emits `monthChange` with `shiftMonth(year, month, ±1)` — the component does NOT
change its own month (controlled), but the demo host does. The `kc-calendar__day--clickable`
class only with a handler (React) / always (Angular). Loading → `kc-chart-state kind="loading"` height 320.

Tests: (1) 7 weekday headers starting `lun`, 42 day buttons, first `28` outside, `1` inside;
(2) title `octubre de 2026`; `locale="en-US" weekStartsOn=0` → `S M T W T F S`, `October 2026`;
(3) dots per kind with colors, `--many` when count > 1, `aria-label` text; (4) `today`/`selected`
classes and `aria-pressed`; (5) legend totals `3 / 4 / 1`, hidden with `showLegend=false`;
(6) nav buttons emit `monthChange` `{ year: 2026, month: 9 }` / `{ 2026, 11 }` and December → January
of the next year; `showNav=false` removes them; (7) `dayClick` on click and Enter with the day
view (`iso: '2026-10-05'`); (8) footer splits at the colon into `<strong>`; (9) loading → skeleton.

Showcase card (block **Listas y anillos**): "Calendario de jornadas", `CALENDAR_KINDS`,
`CALENDAR_EVENTS`, initial month 2026-10, `selected="2026-10-09"`, `today="2026-10-09"`,
`footer="Cumplimiento: 89,3 %"`, host state for year/month updated on `monthChange`, hint
"Puntos por tipo de evento, mes navegable; el host controla el mes y recibe el día clicado".

```ts
export const CALENDAR_KINDS: CalendarKind[] = [
  { kind: 'done', name: 'Ejecutadas', tone: 'success' },
  { kind: 'pending', name: 'Pendientes', tone: 'info' },
  { kind: 'moved', name: 'Reprogramadas', tone: 'danger' },
];

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
```

---

## Ranking table — `kc-ranking-table` / `RankingTable`

Core: `buildTableModel(rows, columns, format, locale, { sortBy, sortDirection, limit, activeId })`
→ `{ headers, rows }` (`TableRowView`: `rank`, `id`, `label`, `sublabel`, `color`, `active`,
`cells[]` with `text`, `align`, `percent`).

| Input / prop                                    | Type                                                                                               | Default             | Notes                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------- |
| `rows`                                          | `TableRow[]`                                                                                       | `[]`                | `{ id?, label, sublabel?, color?, values: Record<string, number\|string\|null> }` |
| `columns`                                       | `TableColumn[]`                                                                                    | `[]`                | `{ key, header, type?, format?, bar?, align? }`                                   |
| `entityHeader`                                  | `string`                                                                                           | `'Estado / Unidad'` | Header of the first (label) column                                                |
| `sortBy`, `sortDirection`, `limit`, `activeId`  | as core                                                                                            |                     | Controlled; header click emits `sortChange`                                       |
| `showRank`                                      | `boolean`                                                                                          | `true`              | Rank badge in the first column                                                    |
| `caption`                                       | `string`                                                                                           | `''`                | `<caption>` (visually shown)                                                      |
| `label`                                         | `string`                                                                                           | `''`                | `aria-label` of the table when no caption                                         |
| `locale`, `valueFormat`, `loading`, `emptyText` | as usual                                                                                           |                     |                                                                                   |
| events                                          | `rowClick` / `onRowClick(row: TableRow, index)`, `sortChange` / `onSortChange({ key, direction })` |                     |                                                                                   |

DOM:

```html
<div class="kc-chart kc-ranking-table">
  <table class="kc-ranking-table__table" aria-label="…">
    <caption>
      …
    </caption>
    <!-- caption -->
    <thead>
      <tr>
        <th scope="col" class="kc-align--left">Estado / Unidad</th>
        <th
          scope="col"
          class="kc-align--right [kc-ranking-table__sortable]"
          [aria-sort]="descending|ascending|none"
        >
          <button type="button" class="kc-ranking-table__sort-btn">
            Trámites<span class="kc-ranking-table__sort" aria-hidden="true">▾</span>
          </button>
          <!-- button only for numeric columns; ▾ desc, ▴ asc, nothing when unsorted -->
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        class="kc-ranking-table__row [kc-ranking-table__row--first] [kc-ranking-table__row--active] [kc-ranking-table__row--clickable]"
        style="--kc-row-color: <color>"
        tabindex="0"
        aria-label="1. Zulia: …"
        data-id="VE-V"
      >
        <td class="kc-align--left">
          <div class="kc-ranking-table__entity">
            <span class="kc-ranking-table__rank" aria-hidden="true">1</span>
            <!-- showRank -->
            <div>
              <div class="kc-ranking-table__label">Zulia</div>
              <div class="kc-ranking-table__sublabel">UM-ZUL-02</div>
            </div>
          </div>
        </td>
        <td class="kc-align--right">
          <span class="kc-ranking-table__value">
            <span class="kc-ranking-table__text">4.620</span>
            <i class="kc-ranking-table__bar" style="width: 100%"></i>
            <!-- only when cell.percent !== null -->
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

Header click (numeric columns only): emit `sortChange` with the same key toggling
`desc → asc → desc`, or `{ key, direction: 'desc' }` for a new key. Loading → skeleton height
`rows.length * 52 || 200`; empty → empty state 120.

Tests: (1) headers = entityHeader + columns, aligned; (2) rows in input order by default, ranks
1..N, badge on #1 filled class; (3) `sortBy="procedures"` sorts desc and sets `aria-sort`; header
click emits `sortChange` `{ key: 'procedures', direction: 'asc' }` when already desc, `{ key: 'avg', direction: 'desc' }` for another column; (4) cells formatted (`4.620`, `21 min` via column format,
`—` for null); (5) bar `width: 100%` on the max row, none on non-bar columns; (6) `limit=3`;
(7) `rowClick` on click/Enter with the original row and its index in `rows`; (8) `activeId` class;
(9) empty/loading states.

Showcase card (block **Listas y anillos**, full-width card above the two lists): "Ranking de
eficiencia por unidad móvil", hint "Producción y tiempo medio de atención por trámite · clic en
una cabecera numérica para ordenar", `RANKING_TABLE_COLUMNS` / `RANKING_TABLE_ROWS`, host state
`sortBy='procedures'` updated on `sortChange`.

```ts
export const RANKING_TABLE_COLUMNS: TableColumn[] = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => `${v} min` },
  { key: 'days', header: 'Jornadas' },
];

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
```

---
