import { VENEZUELA_MAP } from 'kai-charts-core';
import { RegionMap, type RegionMapProps } from './region-map';

export type { MapRegionClickEvent } from './region-map';

export type VenezuelaMapProps = RegionMapProps;

/**
 * Choropleth of Venezuela (the 24 states — Guayana Esequiba included —, Distrito Capital and
 * Dependencias Federales) that fills in as data arrives: regions without a value stay grey,
 * regions with data are painted with one color whose opacity grows with the value. Geometry,
 * projection and the model come from `kai-charts-core`; the rendering is `RegionMap`, shared
 * with `StateMap`. Same DOM as the Angular `kc-venezuela-map`.
 *
 * ```tsx
 * <VenezuelaMap data={citizens} markers={units} highlight="VE-V" valueHeader="Ciudadanos" />
 * ```
 */
export function VenezuelaMap(props: VenezuelaMapProps) {
  return <RegionMap geometry={VENEZUELA_MAP} {...props} />;
}
