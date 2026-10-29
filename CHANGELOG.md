# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/). The three packages (`kai-charts-core`, `kai-charts`,
`kai-charts-react`) are versioned together.

## [Unreleased]

### Added

- `kai-charts-core`: framework-agnostic layouts (`computeBarLayout`), nice tick scales,
  `Intl`-based value formatting, `--kc-*` palette tokens with `currentColor` fallbacks, bar chart
  helpers (empty detection, legend state, tooltip model) and the shared `.kc-` stylesheets.
- `kai-charts` (Angular): `kc-bar-chart` — vertical/horizontal orientation, grouped/stacked
  series, value labels, grid, zero baseline with negative values, legend with series toggling,
  accessible tooltip (focusable bars with `aria-label`), `barClick` output, mirror table
  (`showTable`), loading and empty states; `provideKaiCharts()` global config (locale `es-VE`).
- `kai-charts-react`: `BarChart`, `Legend`, `Tooltip`, `ChartTable`, `ChartState`,
  `KaiChartsProvider`/`useKaiChartsConfig`, `useContainerWidth`; same DOM, CSS and props as the
  Angular package; styles via `kai-charts-react/styles.css`.
- Demos: Angular (`packages/angular/projects/demo`) and React (`packages/react-demo`), each with
  a showcase of JEMA-like datasets, theme switcher, state toggles and a playground with an editable
  data panel that generates the component code.
- Landing page (`site/`) and GitHub Actions: CI, GitHub Pages deploy of landing + both demos,
  manual npm publish.
- Workspace: pnpm monorepo, Angular 22 CLI + ng-packagr, Vite 8, Vitest, Prettier (100 columns),
  MIT license.
