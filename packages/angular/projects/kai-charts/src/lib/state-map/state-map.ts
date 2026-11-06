import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RegionMapGeometry, hasStateMap, loadStateMap } from 'kai-charts-core';
import { KcChartState } from '../core/chart-state';
import { KcChartTable } from '../core/chart-table';
import { KcTooltip } from '../core/tooltip';
import { KcRegionMapBase } from '../venezuela-map/region-map-base';

/**
 * The Venezuela map one level down: **one state, filled in municipality by municipality**. Same
 * inputs, DOM and behaviour as `kc-venezuela-map` (it shares the template and `KcRegionMapBase`);
 * the geometry of the state is a lazy chunk loaded with `loadStateMap()` the first time it is
 * shown (skeleton meanwhile), or passed preloaded through `geometry` for a synchronous render.
 * The only dot by default is the state capital; the municipal seats read in the tooltip
 * (`Capital = …`) and are drawn only with `showSeats`.
 *
 * ```html
 * <kc-state-map state="Zulia" [data]="byMunicipality" valueHeader="Ciudadanos" />
 * ```
 */
@Component({
  selector: 'kc-state-map',
  imports: [KcChartState, KcChartTable, KcTooltip],
  templateUrl: '../venezuela-map/venezuela-map.html',
  styles: `
    @import 'kai-charts-core/styles/venezuela-map.css';
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'kc-chart kc-map',
    '[style.--kc-map-fill]': 'color()',
    '[style.--kc-map-min]': 'minPercent()',
  },
})
export class KcStateMap extends KcRegionMapBase {
  /** State id (`VE-V`), name (`Zulia`) or alias (`Esequibo`); loaded with `loadStateMap()`. */
  readonly state = input('');
  /** Preloaded geometry (`await loadStateMap(…)`): rendered synchronously, `state` is ignored. */
  readonly geometry = input<RegionMapGeometry | undefined>(undefined);
  /** Header of the first column of the mirror table. */
  readonly regionHeader = input('Municipio');
  /** Text of the empty state shown when `state` is unknown or its chunk fails to load. */
  readonly unknownStateText = input('Estado no disponible');

  private readonly loaded = signal<RegionMapGeometry | null>(null);
  private readonly unknown = signal(false);
  /** Request token: a state change while a chunk is in flight makes the old response stale. */
  private request = 0;

  protected readonly activeGeometry = computed(() => this.geometry() ?? this.loaded());
  protected readonly emptyMessage = computed(() =>
    !this.geometry() && this.unknown() ? this.unknownStateText() : null,
  );
  protected readonly tableHeader = computed(() => this.regionHeader());

  constructor() {
    super();
    effect(() => {
      const preloaded = this.geometry();
      const state = this.state();
      const request = ++this.request;
      untracked(() => {
        this.loaded.set(null);
        this.unknown.set(!preloaded && !hasStateMap(state));
      });
      if (preloaded || !hasStateMap(state)) return;
      loadStateMap(state).then(
        (geometry) => {
          if (request === this.request) this.loaded.set(geometry);
        },
        () => {
          if (request === this.request) this.unknown.set(true);
        },
      );
    });
  }
}
