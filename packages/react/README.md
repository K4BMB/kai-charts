# kai-charts-react

Dependency-free SVG chart and dashboard components for **React 18+**, built on the headless
[`kai-charts-core`](https://github.com/K4BMB/kai-charts/tree/main/packages/core). Same DOM, same
CSS and same behaviour as the Angular package (`kai-charts`): themed by `--kc-*` tokens,
accessible by default, `Intl` formatting with `es-VE` by default, loading and empty states.

| Component           | Use it for                                                         |
| ------------------- | ------------------------------------------------------------------ |
| `<BarChart />`      | Vertical/horizontal, grouped/stacked bars, legend, mirror table    |
| `<LineChart />`     | Lines over categories, monotone-smooth or linear, area, end values |
| `<RingChart />`     | Concentric progress rings with center value/trend and legend       |
| `<VenezuelaMap />`  | Choropleth of the 25 regions that fills in as data arrives         |
| `<KpiCard />`       | Headline indicator with icon, trend chip and subtext               |
| `<ProgressList />`  | Rows with a bar and a traffic-light tone (coverage, compliance)    |
| `<RankingList />`   | Top N with rank badge, value and bar relative to the first row     |
| `<RankingTable />`  | Sortable columns, rank badge, label + sublabel, per-column bars    |
| `<MonthCalendar />` | Month grid with event dots per kind, legend totals, controlled nav |

## Install

```bash
pnpm add kai-charts-react   # or npm i kai-charts-react
```

## Usage

```tsx
import { BarChart, type ChartPointEvent } from 'kai-charts-react';
import 'kai-charts-react/styles.css';

const categories = ['Nacimiento', 'Matrimonio', 'Defunción'];
const series = [{ name: 'Trámites', data: [148, 22, 31] }];

export function Procedures() {
  const onBarClick = (e: ChartPointEvent) => console.log(e);
  return (
    <BarChart
      orientation="horizontal"
      categories={categories}
      series={series}
      label="Trámites por tipo"
      showValues
      showTable
      onBarClick={onBarClick}
    />
  );
}
```

Charts are presentation-only: they receive data already shaped by your view models
(`categories` + `series`) and never fetch anything.

## `<BarChart />`

| Prop               | Type                                        | Default    | Description                                           |
| ------------------ | ------------------------------------------- | ---------- | ----------------------------------------------------- |
| `categories`       | `readonly string[]`                         | —          | Category labels (required)                            |
| `series`           | `readonly ChartSeries[]`                    | —          | `{ name, data: (number \| null)[], color? }`          |
| `orientation`      | `'vertical' \| 'horizontal'`                | `vertical` | Use horizontal for long category names                |
| `stacked`          | `boolean`                                   | `false`    | Stack series instead of grouping them                 |
| `height`           | `number`                                    | `280`      | px; width follows the container (`ResizeObserver`)    |
| `showLegend`       | `boolean \| 'auto'`                         | `'auto'`   | `'auto'` = only with 2+ series. Legend toggles series |
| `showValues`       | `boolean`                                   | `false`    | Value at the end of each bar (total when stacked)     |
| `showGrid`         | `boolean`                                   | `true`     |                                                       |
| `showTable`        | `boolean`                                   | `false`    | Mirror table below the chart (a11y, print)            |
| `barRadius`        | `number`                                    | `2`        |                                                       |
| `barWidth`         | `number`                                    | `0.7`      | Share of each band occupied by bars (thin: `0.25`)    |
| `showValueAxis`    | `boolean`                                   | `true`     | `false` hides the value ticks and their margin        |
| `showCategoryAxis` | `boolean`                                   | `true`     | `false` hides the category labels                     |
| `roundStackTop`    | `boolean`                                   | `false`    | Stacked: round the outer end of each stack            |
| `loading`          | `boolean`                                   | `false`    | Skeleton with `aria-busy`                             |
| `label`            | `string`                                    | `''`       | Accessible name; also the table caption               |
| `categoryHeader`   | `string`                                    | config     | First column header of the table                      |
| `emptyText`        | `string`                                    | config     | Shown when every value is `null`/`undefined`          |
| `locale`           | `string`                                    | config     | BCP 47 locale for `Intl`                              |
| `valueFormat`      | `Intl.NumberFormatOptions \| (v) => string` | —          | e.g. `{ style: 'percent' }`                           |
| `onBarClick`       | `(e: ChartPointEvent) => void`              | —          | Click, Enter or Space on a bar                        |
| `className`        | `string`                                    | —          | Added to the root `.kc-chart.kc-bar-chart`            |
| `style`            | `CSSProperties`                             | —          | Inline style of the root element                      |

`ChartPointEvent` is `{ seriesIndex, categoryIndex, series, category, value }`. Zeros are data
(the axis is drawn); only `null`/`undefined` values count as "no data".

## `<LineChart />`

```tsx
<LineChart
  categories={['May', 'Jun', 'Jul']}
  series={[{ name: 'Jornadas', data: [20, 22, 26] }]}
  area
  showEndValues
  label="Jornadas por mes"
/>
```

Same data shape, legend, tooltip, table, states and config as `<BarChart />`; `null` values break
the line into a gap. Own props:

| Prop               | Type                           | Default    | Description                                       |
| ------------------ | ------------------------------ | ---------- | ------------------------------------------------- |
| `curve`            | `'linear' \| 'smooth'`         | `'smooth'` | Smooth = monotone cubic, never overshoots         |
| `area`             | `boolean`                      | `false`    | Soft fill under each line                         |
| `includeZero`      | `boolean`                      | `true`     | `false` zooms the value axis into the data range  |
| `showValueAxis`    | `boolean`                      | `true`     | `false` = no y axis (dashboard look)              |
| `showCategoryAxis` | `boolean`                      | `true`     |                                                   |
| `showEndValues`    | `boolean`                      | `false`    | Last value of each series printed at the line end |
| `pointRadius`      | `number`                       | `3`        | Points stay focusable even when tiny              |
| `onPointClick`     | `(e: ChartPointEvent) => void` | —          | Click, Enter or Space on a point                  |

## `<RingChart />`

```tsx
<RingChart
  items={[
    { name: 'Saldo', value: 0.917 },
    { name: 'Emitidas', value: 0.942 },
  ]}
  centerLabel="Saldo"
  centerValue={0.917}
  centerTrend={0.038}
/>
```

| Prop               | Type                                        | Default                                          | Description                                      |
| ------------------ | ------------------------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `items`            | `readonly RingItem[]`                       | `[]`                                             | `{ name, value, max? (1), color? }`, outer first |
| `size`             | `number`                                    | `200`                                            | viewBox side; rendered width ≤ size              |
| `thickness`, `gap` | `number`                                    | auto / `4`                                       |                                                  |
| `centerLabel`      | `string`                                    | `''`                                             | Small text above the center value                |
| `centerValue`      | `number \| string`                          | —                                                | Numbers formatted with `valueFormat`             |
| `centerTrend`      | `number`                                    | —                                                | Trend chip under the value                       |
| `invertTrend`      | `boolean`                                   | `false`                                          |                                                  |
| `showLegend`       | `boolean`                                   | `true`                                           | Name + value per ring                            |
| `valueFormat`      | `Intl.NumberFormatOptions \| (v) => string` | `{ style: 'percent', maximumFractionDigits: 1 }` |                                                  |
| `onRingClick`      | `(item: RingItem, index) => void`           | —                                                | Click, Enter or Space on a ring                  |

`locale`, `label`, `loading`, `emptyText`, `className` and `style` work as in every other chart.

## `<VenezuelaMap />`

```tsx
<VenezuelaMap
  data={[
    { id: 'VE-V', value: 5260 },
    { id: 'Miranda', value: 4940 },
  ]}
  markers={[{ id: 'UM-ZUL-02', lat: 10.6427, lng: -71.6125, label: 'Maracaibo', value: 14 }]}
  highlight="VE-V"
  valueHeader="Ciudadanos"
  label="Ciudadanos atendidos por estado"
  onRegionClick={({ id, name, value }) => select(id)}
/>
```

Choropleth of the 23 states + Distrito Capital + Dependencias Federales (geometry in the core,
Natural Earth, public domain). Regions without a value stay grey; regions with data share one
color whose opacity grows with the value, so the map visibly fills in as data arrives. An empty
`data` array still draws the grey map (there is no empty state). The Guayana Esequiba is drawn
hatched by default, as in the official depiction (`showClaimZone={false}` hides it).

| Prop             | Type                               | Default                 | Description                                       |
| ---------------- | ---------------------------------- | ----------------------- | ------------------------------------------------- |
| `data`           | `readonly MapDatum[]`              | `[]`                    | `{ id: 'VE-V' \| 'Zulia', value, label? }`        |
| `markers`        | `readonly MapMarker[]`             | `[]`                    | `{ id, lat, lng, label?, value?, color? }`        |
| `color`          | `string`                           | palette 1               | Fill of the regions with data                     |
| `highlight`      | `string \| readonly string[]`      | `[]`                    | Ids or names drawn with a strong outline          |
| `showLegend`     | `boolean`                          | `true`                  | Gradient min → max, empty swatch, `filled/total`  |
| `showLabels`     | `boolean`                          | `false`                 | Short state names                                 |
| `showClaimZone`  | `boolean`                          | `true`                  | Hatched Guayana Esequiba                          |
| `claimZoneLabel` | `string`                           | `'Zona en Reclamación'` | Drawn only with `showLabels`                      |
| `showTable`      | `boolean`                          | `false`                 | Mirror table, all 25 regions                      |
| `valueHeader`    | `string`                           | `'Valor'`               | Tooltip row name and table column header          |
| `emptyText`      | `string`                           | config                  | Tooltip/table text for regions without data       |
| `minOpacity`     | `number`                           | `0.18`                  | Opacity of the lowest value (the highest is 1)    |
| `onRegionClick`  | `(e: MapRegionClickEvent) => void` | —                       | `{ id, name, value }` (`value` null without data) |
| `onMarkerClick`  | `(marker: MapMarker) => void`      | —                       | The original marker                               |

`label`, `locale`, `valueFormat`, `loading`, `className` and `style` work as usual. Regions and
markers are always focusable (`role="img"`, `aria-label`); the `--clickable` class is added only
when the matching handler is provided. The width follows the container and the svg keeps the
800 × 614 aspect ratio.

## `<KpiCard />`

```tsx
<KpiCard
  label="Jornadas ejecutadas"
  value={128}
  trend={0.12}
  subtext="vs período anterior"
  icon={<CalendarIcon />}
/>
```

| Prop          | Type                                        | Default           | Description                                       |
| ------------- | ------------------------------------------- | ----------------- | ------------------------------------------------- |
| `label`       | `string`                                    | —                 | Required                                          |
| `value`       | `number \| string`                          | —                 | Numbers are formatted, strings rendered as-is     |
| `subtext`     | `string`                                    | `''`              | Secondary line next to the trend                  |
| `trend`       | `number`                                    | —                 | Variation, a ratio by default (`0.12` → `+12%`)   |
| `trendFormat` | `Intl.NumberFormatOptions \| (v) => string` | `KC_TREND_FORMAT` | Signed percent with one decimal                   |
| `invertTrend` | `boolean`                                   | `false`           | Down is good (costs, incidents)                   |
| `valueFormat` | `Intl.NumberFormatOptions \| (v) => string` | —                 |                                                   |
| `locale`      | `string`                                    | config            |                                                   |
| `color`       | `string`                                    | —                 | Accent of the icon circle (`--kc-kpi-accent`)     |
| `loading`     | `boolean`                                   | `false`           | Skeleton blocks, `aria-busy`                      |
| `icon`        | `ReactNode`                                 | —                 | Rendered inside a tinted circle (`.kc-kpi__icon`) |
| `className`   | `string`                                    | —                 | Added to the root `.kc-chart.kc-kpi`              |
| `style`       | `CSSProperties`                             | —                 |                                                   |

The trend chip (`.kc-trend`, up/down/flat arrow, success/danger/neutral tone) is also exported as
`<Trend trend={describeTrend(0.12, 'es-VE')} />` for custom stat headers.

## `<ProgressList />`

```tsx
const density: ProgressItem[] = [
  { label: 'Amazonas', value: 1.7, tone: 'danger', caption: 'Desatendida · 280 trámites' },
  { label: 'Miranda', value: 21.3, tone: 'success', caption: 'Cobertura adecuada' },
];

<ProgressList items={density} label="Densidad de atención" onItemClick={(item) => open(item)} />;
```

| Prop          | Type                                        | Default | Description                                                   |
| ------------- | ------------------------------------------- | ------- | ------------------------------------------------------------- |
| `items`       | `readonly ProgressItem[]`                   | `[]`    | `{ label, value, max?, tone?, color?, caption?, valueText? }` |
| `max`         | `number`                                    | —       | List maximum (default: the largest value)                     |
| `showValues`  | `boolean`                                   | `true`  |                                                               |
| `valueFormat` | `Intl.NumberFormatOptions \| (v) => string` | —       |                                                               |
| `locale`      | `string`                                    | config  |                                                               |
| `label`       | `string`                                    | `''`    | `aria-label` of the list                                      |
| `loading`     | `boolean`                                   | `false` |                                                               |
| `emptyText`   | `string`                                    | config  |                                                               |
| `onItemClick` | `(item: ProgressItem, index) => void`       | —       | Rows are focusable and clickable only when provided           |
| `className`   | `string`                                    | —       | Added to the root `.kc-chart.kc-progress`                     |
| `style`       | `CSSProperties`                             | —       |                                                               |

Tones (`success`, `warning`, `danger`, `info`, `neutral`) are decided by your presenter — the
thresholds are business rules — and map to `--kc-success`, `--kc-warning`, … (`color` overrides).
Each bar is an accessible `role="progressbar"`.

## `<RankingList />`

```tsx
const citizens: RankingItem[] = [
  { id: 'VE-V', label: 'Zulia', value: 5260 },
  { id: 'VE-M', label: 'Miranda', value: 4940, sublabel: 'UM-MIR-01' },
];

<RankingList items={citizens} limit={5} label="Ciudadanos atendidos por estado" />;
```

| Prop          | Type                                        | Default | Description                                                          |
| ------------- | ------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `items`       | `readonly RankingItem[]`                    | `[]`    | `{ id?, label, sublabel?, value, color? }`                           |
| `limit`       | `number`                                    | —       | Top N after sorting                                                  |
| `sort`        | `'desc' \| 'asc' \| 'none'`                 | `desc`  | `none` keeps the input order                                         |
| `showBars`    | `boolean`                                   | `true`  | Bar relative to the first row                                        |
| `showRank`    | `boolean`                                   | `true`  | Rank badge (filled on the first row)                                 |
| `valueFormat` | `Intl.NumberFormatOptions \| (v) => string` | —       |                                                                      |
| `locale`      | `string`                                    | config  |                                                                      |
| `label`       | `string`                                    | `''`    | `aria-label` of the list                                             |
| `loading`     | `boolean`                                   | `false` |                                                                      |
| `emptyText`   | `string`                                    | config  |                                                                      |
| `onItemClick` | `(item: RankingItem, index) => void`        | —       | The original item (matched by `id`/`label`) and its index in `items` |
| `className`   | `string`                                    | —       | Added to the root `.kc-chart.kc-ranking`                             |
| `style`       | `CSSProperties`                             | —       |                                                                      |

## `<RankingTable />`

```tsx
const columns: TableColumn[] = [
  { key: 'procedures', header: 'Trámites', bar: true },
  { key: 'avg', header: 'Tiempo medio', format: (v: number) => `${v} min` },
];
const rows: TableRow[] = [
  { id: 'VE-V', label: 'Zulia', sublabel: 'UM-ZUL-02', values: { procedures: 4620, avg: 18 } },
  { id: 'VE-K', label: 'Lara', sublabel: 'UM-LAR-04', values: { procedures: 4019, avg: 21 } },
];

const [sort, setSort] = useState<SortChangeEvent>({ key: 'procedures', direction: 'desc' });
<RankingTable
  rows={rows}
  columns={columns}
  sortBy={sort.key}
  sortDirection={sort.direction}
  onSortChange={setSort}
/>;
```

| Prop                             | Type                                        | Default             | Description                                                                        |
| -------------------------------- | ------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `rows`                           | `readonly TableRow[]`                       | `[]`                | `{ id?, label, sublabel?, color?, values: Record<key, number \| string \| null> }` |
| `columns`                        | `readonly TableColumn[]`                    | `[]`                | `{ key, header, type?, format?, bar?, align? }`; `text` columns are not sortable   |
| `entityHeader`                   | `string`                                    | `'Estado / Unidad'` | Header of the label column                                                         |
| `sortBy`                         | `string`                                    | —                   | Controlled: header clicks only call `onSortChange`                                 |
| `sortDirection`                  | `'desc' \| 'asc'`                           | `'desc'`            |                                                                                    |
| `limit`                          | `number`                                    | —                   | Rows kept after sorting                                                            |
| `activeId`                       | `string`                                    | —                   | Row drawn with the `--active` class                                                |
| `showRank`                       | `boolean`                                   | `true`              | Rank badge (filled on the first row)                                               |
| `caption`                        | `string`                                    | `''`                | Visible `<caption>`                                                                |
| `label`                          | `string`                                    | `''`                | `aria-label` of the table when there is no caption                                 |
| `valueFormat`                    | `Intl.NumberFormatOptions \| (v) => string` | —                   | Table-wide format; a column `format` wins                                          |
| `locale`, `loading`, `emptyText` | as usual                                    |                     | Skeleton height `rows.length * 52`                                                 |
| `onRowClick`                     | `(row: TableRow, index) => void`            | —                   | The original row (matched by `id`/`label`) and its index in `rows`                 |
| `onSortChange`                   | `(e: SortChangeEvent) => void`              | —                   | `{ key, direction }`: same key toggles `desc → asc → desc`, new key `desc`         |
| `className`                      | `string`                                    | —                   | Added to the root `.kc-chart.kc-ranking-table`                                     |
| `style`                          | `CSSProperties`                             | —                   |                                                                                    |

Numeric headers are real `<button>`s with `aria-sort`; `null` values render as `—` and sink to
the bottom whatever the direction. Bars (`bar: true`) are relative to the column maximum.

## `<MonthCalendar />`

```tsx
const kinds: CalendarKind[] = [
  { kind: 'done', name: 'Ejecutadas', tone: 'success' },
  { kind: 'pending', name: 'Pendientes', tone: 'info' },
];
const events: CalendarEvent[] = [
  { date: '2026-10-05', kind: 'done', count: 2 },
  { date: '2026-10-09', kind: 'pending' },
];

const [period, setPeriod] = useState({ year: 2026, month: 10 });
<MonthCalendar
  year={period.year}
  month={period.month}
  events={events}
  kinds={kinds}
  selected="2026-10-09"
  footer="Cumplimiento: 89,3 %"
  onMonthChange={setPeriod}
  onDayClick={(day) => open(day.iso, day.events)}
/>;
```

| Prop            | Type                             | Default       | Description                                                      |
| --------------- | -------------------------------- | ------------- | ---------------------------------------------------------------- |
| `year`, `month` | `number`                         | current month | `month` 1–12. Controlled: update them on `onMonthChange`         |
| `events`        | `readonly CalendarEvent[]`       | `[]`          | `{ date: 'YYYY-MM-DD', kind, label?, count? }`                   |
| `kinds`         | `readonly CalendarKind[]`        | `[]`          | `{ kind, name, tone?, color? }` → legend entries and dot colors  |
| `selected`      | `string`                         | —             | ISO date drawn as selected (`aria-pressed`)                      |
| `today`         | `string`                         | local today   | ISO date drawn as today (override in tests/snapshots)            |
| `weekStartsOn`  | `number`                         | `1`           | `0` = Sunday                                                     |
| `showLegend`    | `boolean`                        | `true`        | One total per kind                                               |
| `showNav`       | `boolean`                        | `true`        | Previous/next month buttons                                      |
| `footer`        | `string`                         | `''`          | Text under the legend; the part after the first `:` goes in bold |
| `label`         | `string`                         | `''`          | `aria-label` of the grid                                         |
| `locale`        | `string`                         | config        | Month title and weekday names                                    |
| `loading`       | `boolean`                        | `false`       | Skeleton of 320 px                                               |
| `onDayClick`    | `(day: CalendarDayView) => void` | —             | Click, Enter or Space on a day (`iso`, `events`, `dots`…)        |
| `onMonthChange` | `(e: { year, month }) => void`   | —             | Target month computed with `shiftMonth(year, month, ±1)`         |
| `className`     | `string`                         | —             | Added to the root `.kc-chart.kc-calendar`                        |
| `style`         | `CSSProperties`                  | —             |                                                                  |

The grid is always 6 × 7 (stable height); days outside the month are muted, weekends get the
`--weekend` class and each day exposes an `aria-label` with its events (`lunes 5: 2 Ejecutadas`).

### Global configuration

```tsx
import { KaiChartsProvider } from 'kai-charts-react';

<KaiChartsProvider config={{ locale: 'en-US', emptyText: 'No data' }}>
  <App />
</KaiChartsProvider>;
```

Defaults: locale `es-VE`, `emptyText` "Sin datos", `loadingText` "Cargando…", `categoryHeader`
"Categoría". Providers nest and merge.

### Building blocks

`Legend`, `Tooltip`, `ChartTable`, `ChartState`, `Trend` and the `useContainerWidth(ref, fallback)`
hook are exported for custom charts, together with everything from `kai-charts-core`
(`computeBarLayout`, `computeLineLayout`, `computeRingLayout`, `buildMapModel`, `buildMonthGrid`,
`shiftMonth`, `buildTableModel`, `createValueFormatter`, `describeTrend`, `buildProgressRows`,
`buildRankingRows`, `seriesColor`, `toneColor`, types…).

## Theming

The stylesheet only uses `.kc-` classes and reads the same `--kc-*` tokens as the Angular
package: `--kc-color-1..8` for the series palette, `--kc-radius`, `--kc-font-size`,
`--kc-font-family`, `--kc-tooltip-bg`, `--kc-tooltip-text`, `--kc-grid`, `--kc-axis`, `--kc-text`,
`--kc-muted`, `--kc-border`, `--kc-skeleton`, `--kc-focus`, plus `--kc-success`, `--kc-warning`,
`--kc-danger`, `--kc-info` for tones, `--kc-kpi-accent` for the KPI icon and `--kc-map-empty`,
`--kc-map-border`, `--kc-map-highlight`, `--kc-map-claim` for the map. Everything else derives from
`currentColor`, so charts follow the text color of their container (light/dark/brand) without
configuration. The tokens are optional; to override them start from
`kai-charts-core/styles/tokens.css`.

## Development

```bash
pnpm --filter kai-charts-core build     # the core must be built first
pnpm --filter kai-charts-react test     # vitest + jsdom + Testing Library
pnpm --filter kai-charts-react build    # dist/index.js, dist/index.d.ts, dist/kai-charts-react.css
```

See the [monorepo README](https://github.com/K4BMB/kai-charts#readme) for the Angular package,
the demos and the roadmap.

## License

MIT © Kaissar Mahfoud
