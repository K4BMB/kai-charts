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
  ProgressItem,
  ValueFormat,
  buildProgressRows,
  createValueFormatter,
} from 'kai-charts-core';
import { optionalNumberAttribute } from '../core/attributes';
import { KcChartState } from '../core/chart-state';
import { KC_CONFIG } from '../core/config';
import { ItemClickEvent } from '../core/events';

/**
 * Progress list: one row per item with a label, a value and a proportional bar colored by a
 * traffic-light tone (decided by the presenter) or a custom color. Widths, colors and texts
 * are resolved by `buildProgressRows` from `kai-charts-core`.
 *
 * The host element plays the `<ul>` role (`role="list"`, `aria-label`) so the DOM below it
 * matches the React renderer 1:1. Rows are always focusable and emit `itemClick`.
 *
 * ```html
 * <kc-progress-list [items]="density" label="Densidad de atención" (itemClick)="open($event.item)" />
 * ```
 */
@Component({
  selector: 'kc-progress-list',
  imports: [KcChartState],
  templateUrl: './progress-list.html',
  styles: `
    @import 'kai-charts-core/styles/progress-list.css';
    kc-progress-list {
      display: block;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-progress',
    '[attr.role]': 'showList() ? "list" : null',
    '[attr.aria-label]': 'label() || null',
  },
})
export class KcProgressList {
  private readonly config = inject(KC_CONFIG);

  /** Rows of the list. */
  readonly items = input<readonly ProgressItem[]>([]);
  /** Maximum shared by every row (defaults to the largest value in the list). */
  readonly max = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  /** Print the formatted value at the right of each label. */
  readonly showValues = input(true, { transform: booleanAttribute });
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
  readonly itemClick = output<ItemClickEvent<ProgressItem>>();

  private readonly formatter = computed(() =>
    createValueFormatter(this.locale() ?? this.config.locale, this.valueFormat()),
  );
  protected readonly emptyLabel = computed(() => this.emptyText() ?? this.config.emptyText);
  protected readonly loadingText = this.config.loadingText;

  protected readonly isEmpty = computed(() => this.items().length === 0);
  protected readonly showList = computed(() => !this.loading() && !this.isEmpty());
  protected readonly skeletonHeight = computed(() => this.items().length * 56 || 160);
  protected readonly rows = computed(() =>
    buildProgressRows(this.items(), this.formatter(), this.max()),
  );

  protected activate(index: number, event?: Event): void {
    event?.preventDefault();
    const item = this.items()[index];
    if (item !== undefined) this.itemClick.emit({ item, index });
  }
}
