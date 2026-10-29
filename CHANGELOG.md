# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `kc-bar-chart`: vertical/horizontal orientation, grouped/stacked series, value labels,
  grid, zero baseline with negative values, legend with series toggling, accessible tooltip
  (focusable bars with `aria-label`), `barClick` output, mirror table (`showTable`), loading and
  empty states.
- Core: `--kc-*` CSS tokens with `currentColor` fallbacks, `provideKaiCharts()` global config
  (locale `es-VE`, texts), `Intl`-based value formatting, nice tick scales, `ResizeObserver`
  width tracking, shared legend/tooltip/table/state components.
- Demo app (`projects/demo`) with JEMA-like datasets, theme switcher and state toggles.
- Workspace: Angular 22 CLI, ng-packagr, Vitest specs, Prettier (100 columns), MIT license.
