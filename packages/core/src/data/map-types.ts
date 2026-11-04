// Types shared by the generated map geometries (`venezuela.ts`, `states/*.ts`).

/** Equirectangular projection fitted to one map: lon/lat → viewBox px (see `projectPoint()`). */
export interface MapProjection {
  minLng: number;
  maxLat: number;
  cosMid: number;
  scale: number;
}

export interface MapRegionGeometry {
  /**
   * Region id: ISO 3166-2 code on the national map (`VE-V`; `VE-GE` for Guayana Esequiba, which
   * has no ISO code), slug of the municipality name on a state map (`maracaibo`).
   */
  id: string;
  name: string;
  /** Short label for small maps. */
  short: string;
  /** Official code when the region has one: INE municipality code (`2308`) on state maps. */
  code?: string;
  /** SVG path in viewBox coordinates. */
  path: string;
  /** Label anchor (centroid of the largest polygon). */
  labelX: number;
  labelY: number;
  /** Capital of the region (state capital / municipal seat), when known. */
  capital?: { name: string; lat: number; lng: number };
}

/** One complete map: its regions, the viewBox they are drawn in and the projection they share. */
export interface RegionMapGeometry {
  /** `VE` for the national map, the state id (`VE-V`) for a state map. */
  id: string;
  name: string;
  viewBox: { width: number; height: number };
  projection: MapProjection;
  regions: readonly MapRegionGeometry[];
  /** Capital of the whole map (the state capital on a state map), drawn as a distinct dot. */
  capital?: { name: string; lat: number; lng: number };
}
