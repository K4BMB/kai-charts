# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/). The three packages (`kai-charts-core`, `kai-charts`,
`kai-charts-react`) are versioned together.

## [Unreleased]

## [0.4.0] - 2026-10-30

### Added

- **Playground v2** in both demos: `#/playground/<chart>` with a picker and one sandbox per
  component (bar, line, ring, KPI, progress, ranking, table, calendar, map) — editable data
  (matrix or rows editor), every option, live events and a generated code snippet to copy.
- **Month calendar** — `kc-month-calendar` / `MonthCalendar`: 6-week grid with event dots per
  kind (tone colors), today/selected states, controlled month navigation (`monthChange`),
  `dayClick`, legend with per-kind totals of the visible month, footer text, locale-aware weekday
  labels (`weekStartsOn`).
- **Ranking table** — `kc-ranking-table` / `RankingTable`: rank badge, label + sublabel,
  numeric columns with per-column formats and an optional bar, controlled sorting from the
  headers (`sortChange`), `limit`, `activeId`, `rowClick`, caption, loading/empty states.
- Venezuela map: state capitals drawn as small dots in every state (`showCapitals`, default on)
  with the capital name as a second tooltip row (`capitalHeader`); edge-aware tooltip placement
  (`mapTooltipPlacement`) so bubbles over Zulia or Delta Amacuro stay inside the chart.
- Core: `buildMonthGrid`/`shiftMonth`/`monthTitle`/`weekdayLabels`, `buildTableModel`,
  `capital` on `MapRegionGeometry` and `capitalPoint` on `MapRegionView`; `TooltipRow.color` is
  optional (rows without swatch); `month-calendar.css`, `ranking-table.css`.
- Demos: "Calendario de jornadas" and "Ranking de eficiencia por unidad móvil" cards; the
  showcase map now shows capitals instead of sample markers and no highlighted outline.

### Changed

- Highlighted map regions use a 1.5 px outline (was 2 px).

## [0.3.0] - 2026-10-30

### Added

- **Venezuela map** — `kc-venezuela-map` / `VenezuelaMap`: choropleth of the 25 regions that fills
  in as data arrives (grey without data, fill opacity proportional to the value), ids by ISO code
  or name, markers by lat/lng, legend min → max with filled/total counter, highlight outline,
  tooltip, region/marker click events, labels, mirror table, Zona en Reclamación hatched by
  default. Geometry generated from Natural Earth (public domain) with shared borders
  (`packages/core/scripts/build-venezuela-map.mjs`) and shipped inside `kai-charts-core`.
- **Line chart** — `kc-line-chart` / `LineChart`: one or many series, monotone cubic curve
  (`curve="smooth"`, default) or straight segments, optional area, gaps on `null`, value axis with
  or without zero (`includeZero`), end-value labels, legend toggling, tooltip per category,
  `pointClick`, mirror table, loading/empty states.
- **Ring chart** — `kc-ring-chart` / `RingChart`: concentric progress rings with center label,
  value and trend chip, legend with figures, tooltip, `ringClick`.
- Bar chart: `barWidth`, `showValueAxis`, `showCategoryAxis` and `roundStackTop` inputs (thin
  bars with rounded stack ends, axis-less look).
- Core: `computeLineLayout`, `linePath`, `computeRingLayout`, `categoryTooltip`,
  `niceDomain(..., includeZero)`; `--kc-surface` token; `line-chart.css`, `ring-chart.css`,
  `venezuela-map.css`.
- Demos: "Mapa" block with a data-arrival simulation, line and ring cards, new bar options on the
  sync card.

### Fixed

- KPI loading skeleton was invisible (transparent `currentColor` background) and laid out inline.
- Angular `kc-chart-table` accepts `emptyText` for empty cells (parity with React).

## [0.2.0] - 2026-10-30

### Added

- **KPI card** — `kc-kpi-card` / `KpiCard`: label, formatted value (number or string), subtext,
  trend chip (`describeTrend`, `invertTrend` for "down is good" metrics), projected icon
  (`kcIcon` directive / `icon` prop), accent color, loading skeleton.
- **Progress list** — `kc-progress-list` / `ProgressList`: rows with a bar, traffic-light tone
  decided by the presenter (`success`/`warning`/`danger`/`info`), caption, `role="progressbar"`,
  `itemClick`.
- **Ranking list** — `kc-ranking-list` / `RankingList`: sorted Top-N with rank badge, sublabel,
  proportional bar, `itemClick` with the original item.
- Core: `toneColor`, `describeTrend`, `buildProgressRows`, `buildRankingRows`; semantic tokens
  `--kc-success/--kc-warning/--kc-danger/--kc-info`; `trend.css`, `kpi-card.css`,
  `progress-list.css`, `ranking-list.css`.
- `docs/contract.md`: the DOM/props/tests contract shared by both renderers.
- Demos reorganised in blocks (Indicadores / Barras / Listas) with the dashboard sample data.

## [0.1.0] - 2026-10-29

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
