# kai-charts-react

Dependency-free SVG chart components for **React 18+**, built on the headless
[`kai-charts-core`](https://github.com/K4BMB/kai-charts/tree/main/packages/core). Same DOM, same
CSS and same behaviour as the Angular package (`kai-charts`): themed by `--kc-*` tokens,
accessible by default, `Intl` formatting with `es-VE` by default, loading and empty states.

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

`Legend`, `Tooltip`, `ChartTable`, `ChartState` and the `useContainerWidth(ref, fallback)` hook
are exported for custom charts, together with everything from `kai-charts-core`
(`computeBarLayout`, `createValueFormatter`, `seriesColor`, types…).

## Theming

The stylesheet only uses `.kc-` classes and reads the same `--kc-*` tokens as the Angular
package: `--kc-color-1..8` for the series palette, `--kc-radius`, `--kc-font-size`,
`--kc-font-family`, `--kc-tooltip-bg`, `--kc-tooltip-text`, `--kc-grid`, `--kc-axis`, `--kc-text`,
`--kc-muted`, `--kc-border`, `--kc-skeleton`, `--kc-focus`. Everything else derives from
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
