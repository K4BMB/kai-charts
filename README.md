# kai-charts

Dependency-free SVG chart components for **Angular 20+** — standalone, signals, `OnPush`,
`input()`/`output()`. Built for management dashboards: the charts you actually need, themed by
CSS tokens, accessible by default, and small enough to copy into a project.

- **Zero dependencies** beyond Angular. Pure SVG, no canvas, no d3.
- **Theme-aware**: colors come from `--kc-color-1..8` and `currentColor`, so charts inherit your
  app theme (light/dark/brand) without configuration.
- **Responsive** through `ResizeObserver`; fixed height, fluid width.
- **Accessible**: labelled SVG, keyboard-focusable data points with `aria-label`, visual tooltip,
  and an optional mirror `<table>` (`showTable`) for screen readers and print.
- **Intl formatting** with `es-VE` by default; any locale, Intl options or custom formatter.
- Loading and empty states built in.

## Components

| Component          | Status  | Notes                                                    |
| ------------------ | ------- | -------------------------------------------------------- |
| `kc-bar-chart`     | ✅ v0.1 | vertical / horizontal, grouped / stacked, values, legend |
| `kc-donut-chart`   | planned | center value                                             |
| `kc-line-chart`    | planned | one or more series, optional area                        |
| `kc-kpi-card`      | planned | label, value, subtext, icon, trend                       |
| `kc-progress-list` | planned | rows with bar and traffic-light status                   |

Out of scope for v1: zoom, complex animations, export.

## Install

```bash
pnpm add kai-charts   # or npm i kai-charts
```

### As a local dependency (before it is published, or to iterate)

```bash
# in this repo
pnpm build            # → dist/kai-charts
# in your app
pnpm add file:../kai-charts/dist/kai-charts
# or: pnpm link ../kai-charts/dist/kai-charts
```

### By copying the folder

Everything the components need lives in `projects/kai-charts/src/lib` (no path aliases, no
external imports). Copy it into your app, e.g. `src/app/shared/ui/charts`, and import from its
`index.ts`:

```ts
import { KcBarChart } from './shared/ui/charts';
```

The copied source uses only Angular 20+ APIs (`input()`, `output()`, `computed`, `@for`,
`afterNextRender`). The prebuilt npm package is produced with the Angular 22 compiler in
partial-Ivy mode.

## Usage

```ts
import { Component } from '@angular/core';
import { ChartSeries, KcBarChart } from 'kai-charts';

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

Charts are presentation-only: they receive data already shaped by your presenters/view models
(`categories` + `series`) and never call services, so they fit a hexagonal architecture as a
pure UI adapter.

### `kc-bar-chart`

| Input            | Type                                        | Default    | Description                                           |
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

| Output     | Payload                                                                            |
| ---------- | ---------------------------------------------------------------------------------- |
| `barClick` | `{ seriesIndex, categoryIndex, series, category, value }` on click, Enter or Space |

Zeros are data (the axis is drawn); only `null`/`undefined` values count as "no data".

### Global configuration

```ts
import { provideKaiCharts } from 'kai-charts';

bootstrapApplication(App, {
  providers: [provideKaiCharts({ locale: 'es-VE', emptyText: 'Sin datos' })],
});
```

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
is readable without extra work. The full token list with defaults is in
[`styles/kai-charts.css`](projects/kai-charts/src/lib/styles/kai-charts.css) (also shipped in
the package as `kai-charts/styles/kai-charts.css`). Tailwind 4 users can map tokens from
`@theme` variables: `--kc-color-1: var(--color-primary)`.

## Development

```bash
pnpm install
pnpm start          # demo app on http://localhost:4200
pnpm test           # Vitest, library specs
pnpm test:all       # library + demo
pnpm build          # ng-packagr → dist/kai-charts (+ README, LICENSE, CHANGELOG)
pnpm pack           # tarball for local installs
pnpm format         # Prettier, 100 columns
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) in English.
Changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © Kaissar Mahfoud
