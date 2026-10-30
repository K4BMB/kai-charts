# kai-charts-react

Dependency-free SVG chart and dashboard components for **React 18+**, built on the headless
[`kai-charts-core`](https://github.com/K4BMB/kai-charts/tree/main/packages/core). Same DOM, same
CSS and same behaviour as the Angular package (`kai-charts`): themed by `--kc-*` tokens,
accessible by default, `Intl` formatting with `es-VE` by default, loading and empty states.

| Component          | Use it for                                                      |
| ------------------ | --------------------------------------------------------------- |
| `<BarChart />`     | Vertical/horizontal, grouped/stacked bars, legend, mirror table |
| `<KpiCard />`      | Headline indicator with icon, trend chip and subtext            |
| `<ProgressList />` | Rows with a bar and a traffic-light tone (coverage, compliance) |
| `<RankingList />`  | Top N with rank badge, value and bar relative to the first row  |

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

| Prop             | Type                                        | Default    | Description                                           |
| ---------------- | ------------------------------------------- | ---------- | ----------------------------------------------------- |
| `categories`     | `readonly string[]`                         | —          | Category labels (required)                            |
| `series`         | `readonly ChartSeries[]`                    | —          | `{ name, data: (number \| null)[], color? }`          |
| `orientation`    | `'vertical' \| 'horizontal'`                | `vertical` | Use horizontal for long category names                |
| `stacked`        | `boolean`                                   | `false`    | Stack series instead of grouping them                 |
| `height`         | `number`                                    | `280`      | px; width follows the container (`ResizeObserver`)    |
| `showLegend`     | `boolean \| 'auto'`                         | `'auto'`   | `'auto'` = only with 2+ series. Legend toggles series |
| `showValues`     | `boolean`                                   | `false`    | Value at the end of each bar (total when stacked)     |
| `showGrid`       | `boolean`                                   | `true`     |                                                       |
| `showTable`      | `boolean`                                   | `false`    | Mirror table below the chart (a11y, print)            |
| `barRadius`      | `number`                                    | `2`        |                                                       |
| `loading`        | `boolean`                                   | `false`    | Skeleton with `aria-busy`                             |
| `label`          | `string`                                    | `''`       | Accessible name; also the table caption               |
| `categoryHeader` | `string`                                    | config     | First column header of the table                      |
| `emptyText`      | `string`                                    | config     | Shown when every value is `null`/`undefined`          |
| `locale`         | `string`                                    | config     | BCP 47 locale for `Intl`                              |
| `valueFormat`    | `Intl.NumberFormatOptions \| (v) => string` | —          | e.g. `{ style: 'percent' }`                           |
| `onBarClick`     | `(e: ChartPointEvent) => void`              | —          | Click, Enter or Space on a bar                        |
| `className`      | `string`                                    | —          | Added to the root `.kc-chart.kc-bar-chart`            |
| `style`          | `CSSProperties`                             | —          | Inline style of the root element                      |

`ChartPointEvent` is `{ seriesIndex, categoryIndex, series, category, value }`. Zeros are data
(the axis is drawn); only `null`/`undefined` values count as "no data".

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
(`computeBarLayout`, `createValueFormatter`, `describeTrend`, `buildProgressRows`,
`buildRankingRows`, `seriesColor`, `toneColor`, types…).

## Theming

The stylesheet only uses `.kc-` classes and reads the same `--kc-*` tokens as the Angular
package: `--kc-color-1..8` for the series palette, `--kc-radius`, `--kc-font-size`,
`--kc-font-family`, `--kc-tooltip-bg`, `--kc-tooltip-text`, `--kc-grid`, `--kc-axis`, `--kc-text`,
`--kc-muted`, `--kc-border`, `--kc-skeleton`, `--kc-focus`, plus `--kc-success`, `--kc-warning`,
`--kc-danger`, `--kc-info` for tones and `--kc-kpi-accent` for the KPI icon. Everything else derives from
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
