import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { RegionMapGeometry, VENEZUELA_MAP } from 'kai-charts-core';
import { KcChartState } from '../core/chart-state';
import { KcChartTable } from '../core/chart-table';
import { KcTooltip } from '../core/tooltip';
import { KcRegionMapBase } from './region-map-base';

export type { MapRegionClickEvent } from './region-map-base';

/**
 * Choropleth of Venezuela (the 24 states — Guayana Esequiba included, as Venezuelan law
 * establishes —, Distrito Capital and Dependencias Federales) that fills in as data arrives:
 * regions without a value stay grey, regions with data are painted with one color whose opacity
 * grows with the value. Optional markers (mobile units, offices) are projected from lat/lng.
 * Geometry and the data join come from `kai-charts-core` (`VENEZUELA_MAP`, `buildMapModel`);
 * the behaviour lives in `KcRegionMapBase`, shared with `KcStateMap`.
 *
 * ```html
 * <kc-venezuela-map [data]="byState" [markers]="units" highlight="VE-V" label="Ciudadanos" />
 * ```
 */
@Component({
  selector: 'kc-venezuela-map',
  imports: [KcChartState, KcChartTable, KcTooltip],
  templateUrl: './venezuela-map.html',
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
export class KcVenezuelaMap extends KcRegionMapBase {
  protected readonly activeGeometry = signal<RegionMapGeometry | null>(VENEZUELA_MAP).asReadonly();
  protected readonly emptyMessage = signal<string | null>(null).asReadonly();
  protected readonly tableHeader = computed(() => this.config.categoryHeader);
}
