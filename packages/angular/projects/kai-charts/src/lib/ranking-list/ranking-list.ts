import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  RankingItem,
  RankingRowView,
  RankingSort,
  ValueFormat,
  buildRankingRows,
  createValueFormatter,
} from 'kai-charts-core';
import { optionalNumberAttribute } from '../core/attributes';
import { KcChartState } from '../core/chart-state';
import { KC_CONFIG } from '../core/config';
import { ItemClickEvent } from '../core/events';

/**
 * Ranking list (Top N): rank badge, label, optional sublabel, formatted value and a bar
 * proportional to the first row. Sorting, limiting and widths come from `buildRankingRows`
 * of `kai-charts-core`.
 *
 * The host element plays the `<ol>` role (`role="list"`, `aria-label`) so the DOM below it
 * matches the React renderer 1:1. Rows are always focusable and emit `itemClick` with the
 * ORIGINAL item (matched by `id`, falling back to `label`) and its index in `items`.
 *
 * ```html
 * <kc-ranking-list [items]="byState" limit="5" label="Ciudadanos atendidos por estado" />
 * ```
 */
@Component({
  selector: 'kc-ranking-list',
  imports: [KcChartState],
  templateUrl: './ranking-list.html',
  styles: `
    @import 'kai-charts-core/styles/ranking-list.css';
    kc-ranking-list {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-ranking',
    '[attr.role]': 'showList() ? "list" : null',
    '[attr.aria-label]': 'label() || null',
  },
})
export class KcRankingList {
  private readonly config = inject(KC_CONFIG);

  /** Entries of the ranking, in any order. */
  readonly items = input<readonly RankingItem[]>([]);
  /** Keep only the first N rows after sorting (Top N). */
  readonly limit = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** `desc` by default; `none` keeps the input order. */
  readonly sort = input<RankingSort>('desc');
  /** Draw the proportional bar under each row. */
  readonly showBars = input(true, { transform: booleanAttribute });
  /** Show the rank badge. */
  readonly showRank = input(true, { transform: booleanAttribute });
  /** `Intl.NumberFormat` options or a custom `(value) => string`. */
  readonly valueFormat = input<ValueFormat | undefined>(undefined);
  /** Locale for `Intl` formatting (defaults to the global config, `es-VE`). */
  readonly locale = input<string | undefined>(undefined);
  /** Accessible name of the list. */
  readonly label = input('');
  readonly loading = input(false, { transform: booleanAttribute });
  /** Empty-state text (defaults to the global config). */
  readonly emptyText = input<string | undefined>(undefined);

  /** Emitted on click, Enter or Space over a row with the original item and its index. */
  readonly itemClick = output<ItemClickEvent<RankingItem>>();

  private readonly formatter = computed(() =>
    createValueFormatter(this.locale() ?? this.config.locale, this.valueFormat()),
  );
  protected readonly emptyLabel = computed(() => this.emptyText() ?? this.config.emptyText);
  protected readonly loadingText = this.config.loadingText;

  protected readonly isEmpty = computed(() => this.items().length === 0);
  protected readonly showList = computed(() => !this.loading() && !this.isEmpty());
  protected readonly skeletonHeight = computed(() => this.items().length * 52 || 160);
  protected readonly rows = computed(() =>
    buildRankingRows(this.items(), this.formatter(), { limit: this.limit(), sort: this.sort() }),
  );

  protected activate(row: RankingRowView, event?: Event): void {
    event?.preventDefault();
    const items = this.items();
    const index = items.findIndex((item) => (item.id ?? item.label) === row.id);
    if (index >= 0) this.itemClick.emit({ item: items[index], index });
  }
}
