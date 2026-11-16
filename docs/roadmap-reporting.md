# Reporting pack — requirements for 0.8 → 1.0

What management/financial reports need beyond the ten components shipped today. Same rules as the
rest of the repo: every component exists in both renderers (`kai-charts` for Angular,
`kai-charts-react` for React) with the same inputs, the same DOM, the same `.kc-*` classes and the
same tokens; layouts, scales and formatting live once in `kai-charts-core`; `null` means "no data"
and is never drawn as zero; the DOM contract goes in `docs/contract.md` before the renderers are
written.

Data source assumed everywhere: a backend that already returns `{ categories, series }` in the
shape the current components consume. What follows is what is **missing**.

Status: approved for 0.8–1.0 · Frameworks: Angular 20+ and React 18+ only (no other target).

---

## 0. Cross-cutting rules (apply to everything new)

| Rule                                                    | Why                                                                                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `null` is drawn as a gap / "no data", never as `0`      | A missing measurement is not a zero. `kc-line-chart` already does this; keep it everywhere.                                 |
| Negative values in bars and waterfalls                  | Deviations (measured vs. planned) and losses are negative numbers.                                                          |
| Currency format **per value**, not per component        | One report can mix currencies (e.g. USD and VES). Use the core `Intl.NumberFormat` with a `currency` per cell / per series. |
| `locale` defaults to `es-VE`                            | Thousands `.` and decimals `,`. Already in the core; expose it wherever it is missing.                                      |
| Keyboard accessible, `aria-label` on every cell / point | Baseline of the library (every current component has it).                                                                   |
| CSV export from the component (not from the backend)    | "Exportable" is a front-end concern; any backend qualifies.                                                                 |
| New tokens: `--kc-positive`, `--kc-negative`            | Sign colours for finance (default: `--kc-success` / `--kc-danger`).                                                         |

---

## 1. `kc-data-table` / `DataTable` — accounting grid (PRIORITY 1)

Used by every tabular report. `RankingTable` is not enough: it is a ranking, not a grid with
totals, currencies and paging.

### Inputs

| Input            | Type                                       | Default       | Description                                                        |
| ---------------- | ------------------------------------------ | ------------- | ------------------------------------------------------------------ |
| `columns`        | `DataTableColumn[]`                        | `[]`          | See below                                                          |
| `rows`           | `Record<string, unknown>[]`                | `[]`          | One object per row, read through `column.key`                      |
| `totals`         | `'auto' \| Record<string, number> \| null` | `'auto'`      | `'auto'` sums the `money` / `number` columns flagged `total: true` |
| `sortable`       | `boolean`                                  | `true`        | Header click; cycle asc → desc → unsorted                          |
| `pageSize`       | `number \| null`                           | `25`          | `null` = no paging                                                 |
| `stickyHeader`   | `boolean`                                  | `true`        |                                                                    |
| `dense`          | `boolean`                                  | `false`       |                                                                    |
| `emptyText`      | `string`                                   | `'Sin datos'` |                                                                    |
| `exportFileName` | `string \| null`                           | `null`        | When set, shows the "Exportar CSV" button                          |
| `locale`         | `string`                                   | `'es-VE'`     |                                                                    |
| `rowKey`         | `string`                                   | `'id'`        | For `trackBy` / `key`                                              |

```ts
interface DataTableColumn {
  key: string;
  header: string;
  type?: 'text' | 'number' | 'money' | 'percent' | 'date' | 'badge';
  currencyKey?: string; // row field holding the ISO code (e.g. 'currency'); falls back to `currency`
  currency?: string; // fixed ISO code for the whole column
  decimals?: number; // default: money 2, percent 2, number 0
  total?: boolean; // takes part in the totals row
  align?: 'left' | 'right' | 'center'; // default: numeric types right-aligned
  width?: string;
  badgeColors?: Record<string, string>; // type 'badge': { OverThreshold: 'var(--kc-danger)' }
  format?: (value: unknown, row: Record<string, unknown>) => string; // escape hatch
}
```

### Behaviour

- Totals row pinned at the bottom; `money` columns are totalled **only when the whole column shares
  one currency**, otherwise the cell shows "—" with the tooltip "Monedas mixtas".
- `null` / `undefined` → "—" (muted), never "0".
- Negative `money` / `number`: `--kc-negative` colour and explicit sign.
- CSV export honours visible columns and the current order; numbers unformatted (dot decimal) so
  spreadsheets parse them.
- Events: `rowClick(row)`, `sortChange({ key, direction })`, `pageChange(page)`.

### Typical rows

- Payout per partner: name, tax id, trip count, unit count, total (money).
- Distance comparison per trip: origin → destination, planned km, measured km, odometer km
  (may be `null`), difference, difference %, status (badge).
- Profitability per trip: revenue (may be `null`), partner cost, expenses, total cost, profit,
  margin %, cost per km.

---

## 2. `kc-waterfall-chart` / `WaterfallChart` — bridge chart (PRIORITY 2)

Profit bridges and cost breakdowns. The backend sends the steps ready to draw:

```json
"waterfall": {
  "categories": ["Ingreso", "Socio", "Combustible", "Peajes", "Utilidad"],
  "series": [{ "name": "Resultado (USD)", "data": [null, -300, -60, -10, null] }]
}
```

### Inputs

| Input          | Type                     | Default     | Description                                              |
| -------------- | ------------------------ | ----------- | -------------------------------------------------------- |
| `categories`   | `string[]`               | `[]`        | Steps                                                    |
| `data`         | `(number \| null)[]`     | `[]`        | One value per step: positive goes up, negative goes down |
| `totalIndexes` | `number[]`               | `[0, last]` | Which steps are "totals" (bar from zero, neutral colour) |
| `height`       | `number`                 | `280`       |                                                          |
| `showValues`   | `boolean`                | `true`      |                                                          |
| `currency`     | `string \| null`         | `null`      | Value format                                             |
| `locale`       | `string`                 | `'es-VE'`   |                                                          |
| `colors`       | `{ up?, down?, total? }` | tokens      | `--kc-positive`, `--kc-negative`, `--kc-color-1`         |

### Behaviour

- Every intermediate bar starts where the previous one ended (floating); thin connectors between
  bars.
- A `null` step: no bar, "sin dato" label, and **the following steps continue from the last known
  position** (zero is never assumed). Real case: the first and last totals arrive as `null` until the
  revenue module exists.
- Tooltip: step name, step value, running total.

---

## 3. `kc-period-picker` / `PeriodPicker` — period selector (PRIORITY 3)

The common filter of every report. Produces `from` / `to` for the query string.

### Inputs

| Input                | Type                           | Default                                                  | Description                |
| -------------------- | ------------------------------ | -------------------------------------------------------- | -------------------------- |
| `value`              | `{ from: string; to: string }` | current month                                            | ISO `YYYY-MM-DD`           |
| `presets`            | `PeriodPreset[]`               | `['week','fortnight','month','quarter','year','custom']` |                            |
| `fortnightStartDays` | `[number, number]`             | `[1, 16]`                                                | Fortnights 1–15 and 16–end |
| `maxRangeDays`       | `number \| null`               | `366`                                                    | Protects the backend       |
| `locale`             | `string`                       | `'es-VE'`                                                | Month / day names          |
| `weekStartsOn`       | `0..6`                         | `1`                                                      | Monday                     |

### Behaviour

- Preset chips + ‹ › navigation of the period + free range with two calendars (reuse
  `kc-month-calendar`).
- Emits `valueChange({ from, to, preset })` only for valid ranges (`to >= from`).
- Shows the human label: "1–15 oct 2026", "Oct 2026", "Sem 42".

---

## 4. `kc-line-chart` — extension: reference band and outliers

Measured vs. expected series (distance, fuel efficiency, any tolerance check).

### New inputs (optional, backwards compatible)

| Input              | Type                                                                             | Description                                                          |
| ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `reference`        | `{ series: number \| string; tolerancePercent?: number; toleranceAbs?: number }` | Series taken as "expected" and the ±tolerance band                   |
| `highlightOutside` | `boolean`                                                                        | Filled dot on the values of other series outside the band            |
| `consecutiveAlert` | `number \| null`                                                                 | N consecutive points outside → highlighted segment (sustained alert) |

### Behaviour

- The band is a translucent area around the reference series.
- `null` in the reference → no band on that stretch.
- Event `outsideChange(indexes: number[])` so the report can list the affected items.

---

## 5. `kc-bar-chart` — extension: negatives and zero line

| Change                                                                                   | Status today                                                      |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Negative `data`: the axis crosses at 0, bars go down / left                              | **Done** — the layout keeps the baseline at zero (tested in core) |
| Zero line visible when there are negatives                                               | **Done** — `axisLine` sits at zero in both orientations           |
| `showValues` with sign                                                                   | **Done** — `Intl` formatting keeps the minus sign                 |
| Optional colour by sign: `colorBySign: boolean` (uses `--kc-positive` / `--kc-negative`) | **To do** — plus a renderer test for a mixed-sign series          |

---

## 6. `kc-heatmap` / `Heatmap` — matrix (PRIORITY 4)

Compliance traffic lights (unit × document) and comparisons (unit × route, unit × month).

### Inputs

| Input                        | Type                                                | Description                                                |
| ---------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `rows`                       | `string[]`                                          | Row labels                                                 |
| `columns`                    | `string[]`                                          | Column labels                                              |
| `data`                       | `(number \| null)[][]`                              | `[row][col]`; `null` = no data (grey cell)                 |
| `scale`                      | `'sequential' \| 'diverging' \| 'categorical'`      | `categorical` for traffic lights (0/1/2 → green/amber/red) |
| `categories`                 | `{ value: number; label: string; color: string }[]` | Only for `categorical`                                     |
| `cellLabel`                  | `boolean`                                           | Show the value inside the cell                             |
| `rowTotals` / `columnTotals` | `boolean`                                           | Count per row / column (e.g. expired documents per unit)   |

### Behaviour

- Cell click → `cellClick({ row, col, value })`.
- Horizontal scroll with the label column pinned.

---

## 7. Already covered by the current components

| Report type         | Components used today                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Partner payouts     | `kc-kpi-card` (total, trips), horizontal `kc-bar-chart`, `kc-ranking-table` (top partners)                                          |
| Distance comparison | `kc-line-chart` with 3 series and nulls, `kc-bar-chart` of deviations (§5), `kc-kpi-card` (missing GPS / odometer / over threshold) |
| Profitability       | grouped `kc-bar-chart` (per unit, per customer), `kc-ring-chart` (cost by concept), `kc-kpi-card`                                   |

---

## 8. Build order

1. `kc-data-table` → unblocks every tabular report.
2. `kc-waterfall-chart` → the JSON is already produced by backends.
3. `kc-period-picker` → the filter of every report.
4. `kc-bar-chart` `colorBySign` (the rest of §5 is done).
5. `kc-line-chart` reference band.
6. `kc-heatmap`.

Each one: core (layout / scale / format) + Angular + React + tests + section in `docs/contract.md`

- README row + demo card and playground sandbox. Versions: 0.8 (1–3), 0.9 (4–5), 1.0 (6).
