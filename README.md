# kai-charts

Dependency-free SVG chart components for management dashboards, with one headless core and two
renderers that share the same API, the same CSS and the same theme tokens:

| Package                              | For                 | Install                     |
| ------------------------------------ | ------------------- | --------------------------- |
| [`kai-charts`](packages/angular)     | Angular 20+         | `pnpm add kai-charts`       |
| [`kai-charts-react`](packages/react) | React 18+           | `pnpm add kai-charts-react` |
| [`kai-charts-core`](packages/core)   | Any (layouts, Intl) | `pnpm add kai-charts-core`  |

**Live demos (GitHub Pages):** [landing](https://k4bmb.github.io/kai-charts/) ·
[Angular demo + playground](https://k4bmb.github.io/kai-charts/angular/) ·
[React demo + playground](https://k4bmb.github.io/kai-charts/react/). Each playground has an
editable data panel (categories, series, every number) and generates the code to paste in your app.

- **Zero dependencies** beyond the framework. Pure SVG, no canvas, no d3.
- **Theme-aware**: colors come from `--kc-color-1..8` and `currentColor`, so charts inherit your
  app theme (light/dark/brand) without configuration.
- **Responsive** through `ResizeObserver`; fixed height, fluid width.
- **Accessible**: labelled SVG, keyboard-focusable data points with `aria-label`, visual tooltip,
  and an optional mirror `<table>` (`showTable`) for screen readers and print.
- **Intl formatting** with `es-VE` by default; any locale, Intl options or custom formatter.
- Loading and empty states built in. Zeros are data; only `null`/`undefined` is "no data".

## Components

| Component      | Angular             | React           | Status  |
| -------------- | ------------------- | --------------- | ------- |
| Bar chart      | `kc-bar-chart`      | `BarChart`      | ✅ v0.1 |
| KPI card       | `kc-kpi-card`       | `KpiCard`       | ✅ v0.2 |
| Progress list  | `kc-progress-list`  | `ProgressList`  | ✅ v0.2 |
| Ranking list   | `kc-ranking-list`   | `RankingList`   | ✅ v0.2 |
| Venezuela map  | `kc-venezuela-map`  | `VenezuelaMap`  | ✅ v0.3 |
| Line chart     | `kc-line-chart`     | `LineChart`     | ✅ v0.3 |
| Ring chart     | `kc-ring-chart`     | `RingChart`     | ✅ v0.3 |
| Month calendar | `kc-month-calendar` | `MonthCalendar` | planned |
| Ranking table  | `kc-ranking-table`  | `RankingTable`  | planned |

Every component exists in both renderers with the same inputs, the same DOM and the same `.kc-*`
CSS. The DOM/props/tests contract each pair follows lives in [`docs/contract.md`](docs/contract.md).

**Venezuela map.** A choropleth of the 23 states + Distrito Capital + Dependencias Federales that
fills in as data arrives: states without a value stay grey, states with data get the fill color
with an opacity proportional to the value. Ids accept ISO 3166-2 codes (`VE-V`) or names
(`Zulia`, `Dtto. Capital`, `Vargas`). Optional markers by `lat`/`lng` (mobile units), legend
min → max with the filled/total counter, and the Zona en Reclamación hatched by default
(`showClaimZone="false"` hides it). Geometry comes from Natural Earth (public domain), simplified
with shared borders so neighbouring states never overlap or leave gaps, and ships inside
`kai-charts-core` (≈32 KB) — no external data files.

Out of scope for v1: zoom, complex animations, export.

## Usage

### Angular

```ts
import { Component } from '@angular/core';
import { ChartPointEvent, ChartSeries, KcBarChart } from 'kai-charts';

@Component({
  selector: 'app-procedures',
  imports: [KcBarChart],
  template: `
    <kc-bar-chart
      orientation="horizontal"
      [categories]="categories"
      [series]="series"
      label="Trámites por tipo"
      showValues
      showTable
      (barClick)="onBarClick($event)"
    />
  `,
})
export class Procedures {
  categories = ['Nacimiento', 'Matrimonio', 'Defunción'];
  series: ChartSeries[] = [{ name: 'Trámites', data: [148, 22, 31] }];
  onBarClick(e: ChartPointEvent) {}
}
```

Styles are embedded in the components (`ViewEncapsulation.None`, `.kc-` prefixed): nothing to
import. Global defaults: `provideKaiCharts({ locale: 'en-US', emptyText: 'No data' })`.

### React

```tsx
import { BarChart } from 'kai-charts-react';
import 'kai-charts-react/styles.css';

export function Procedures() {
  return (
    <BarChart
      orientation="horizontal"
      categories={['Nacimiento', 'Matrimonio', 'Defunción']}
      series={[{ name: 'Trámites', data: [148, 22, 31] }]}
      label="Trámites por tipo"
      showValues
      showTable
      onBarClick={(e) => console.log(e)}
    />
  );
}
```

Global defaults: wrap the app in `<KaiChartsProvider value={{ locale: 'en-US' }}>`.

Charts are presentation-only: they receive data already shaped by your presenters/view models
(`categories` + `series`) and never call services, so they fit a hexagonal architecture as a
pure UI adapter.

### Bar chart options (same names in both frameworks)

| Option           | Type                                        | Default    | Description                                           |
| ---------------- | ------------------------------------------- | ---------- | ----------------------------------------------------- |
| `categories`     | `string[]`                                  | `[]`       | Category labels                                       |
| `series`         | `ChartSeries[]`                             | `[]`       | `{ name, data: (number \| null)[], color? }`          |
| `orientation`    | `'vertical' \| 'horizontal'`                | `vertical` | Use horizontal for long category names                |
| `stacked`        | `boolean`                                   | `false`    | Stack series instead of grouping them                 |
| `height`         | `number`                                    | `280`      | px; width follows the container                       |
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

Event: `barClick` (Angular output) / `onBarClick` (React prop) with
`{ seriesIndex, categoryIndex, series, category, value }` on click, Enter or Space.

## Theming

Components read CSS custom properties and fall back to sensible defaults, so nothing is required.
Define the tokens on `:root` (or any ancestor) to inherit your theme:

```css
:root {
  --kc-color-1: #2563eb; /* … --kc-color-8 */
  --kc-font-size: 12px;
  --kc-radius: 6px;
}
[data-theme='dark'] {
  --kc-tooltip-bg: #e2e8f0;
  --kc-tooltip-text: #0b1220;
}
```

Text, grid, axis and skeleton colors derive from `currentColor`, so a chart inside a dark card
is readable without extra work. The full token list with defaults lives in
[`packages/core/styles/tokens.css`](packages/core/styles/tokens.css) (shipped as
`kai-charts-core/styles/tokens.css` and `kai-charts/styles/tokens.css`). Tailwind 4 users can
map tokens from `@theme` variables: `--kc-color-1: var(--color-primary)`.

## Using it without npm

- **Angular**: copy `packages/angular/projects/kai-charts/src/lib` into your app (e.g.
  `src/app/shared/ui/charts`) and install only `kai-charts-core`. The folder has no path aliases
  and uses only Angular 20+ APIs.
- **React**: copy `packages/react/src` the same way; import `styles.css` once.
- **Local package**: `pnpm build` then `pnpm add file:../kai-charts/packages/angular/dist/kai-charts`
  (or `file:../kai-charts/packages/react`).

## Repository layout

```
packages/core        kai-charts-core  · layouts, scales, Intl, palette, shared CSS (+ Vitest)
packages/angular     kai-charts       · Angular CLI workspace: library + demo/playground
packages/react       kai-charts-react · Vite library: components + hooks (+ Vitest/RTL)
packages/react-demo  React demo/playground (Vite)
site/                landing page deployed with both demos to GitHub Pages
```

## Development

```bash
pnpm install
pnpm build          # core → angular lib → react lib → react demo
pnpm test           # 65 specs across core, angular and react
pnpm dev:angular    # http://localhost:4200  (showcase, #/playground)
pnpm dev:react      # http://localhost:5173  (showcase, #/playground)
pnpm format         # Prettier, 100 columns
```

CI runs format, build and tests on every push; `main` deploys the landing and both demos to GitHub
Pages. Releases are published to npm with the manual **Publish to npm** workflow (needs the
`NPM_TOKEN` repository secret). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/) in English; changes are tracked in
[CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © Kaissar Mahfoud
