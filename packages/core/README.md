# kai-charts-core

The framework-agnostic core of [kai-charts](https://github.com/K4BMB/kai-charts): pure TypeScript
with no DOM and no dependencies, shared by the two renderers, [`kai-charts`](https://www.npmjs.com/package/kai-charts)
(Angular 20+) and [`kai-charts-react`](https://www.npmjs.com/package/kai-charts-react) (React 18+).
You normally install one of those; they depend on this package. Use it directly only to build
your own renderer or to reuse the geometry and layouts somewhere else (a server, a test, a
different framework).

What is in here:

- **Layouts**: `computeBarLayout`, `computeLineLayout`, `computeRingLayout`, `buildMonthGrid`,
  `buildTableModel`, `buildProgressRows`, `buildRankingRows` — every coordinate, tick, path and
  label a chart needs, computed from data and options.
- **Venezuela maps**: `VENEZUELA_MAP` (the 24 states incl. Guayana Esequiba, Distrito Capital and
  Dependencias Federales) and `loadStateMap(state)` (one state by municipalities, lazy chunk per
  state), `buildMapModel`, `resolveRegionId`, `projectPoint`, `mapTooltipRows`.
- **Formatting and theme**: `createValueFormatter` (Intl, `es-VE` by default), `seriesColor`,
  `toneColor`, `describeTrend`, and the stylesheets under `kai-charts-core/styles/*`
  (`tokens.css` with every `--kc-*` token, one file per component, `all.css`).

```ts
import { computeBarLayout, createValueFormatter, resolveSeries } from 'kai-charts-core';

const format = createValueFormatter('es-VE');
const layout = computeBarLayout({
  width: 600,
  height: 280,
  categories: ['Lun', 'Mar', 'Mié'],
  series: resolveSeries([{ name: 'Trámites', data: [120, 98, 143] }]),
  format,
});
// layout.bars → one rect per bar: x, y, w, h, color, valueLabel, ariaLabel ("Lun: 120")
// layout.valueTicks → { x, y, label: "0" | "20" | … | "160" }; layout.gridLines, layout.axisLine
```

Documentation, demos and the DOM contract the renderers follow live in the
[repository](https://github.com/K4BMB/kai-charts). MIT.
