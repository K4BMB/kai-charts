import type { RegionMapGeometry } from './data/map-types.js';
import { STATE_MAPS, STATE_MAP_LOADERS, type StateMapInfo } from './data/states/index.js';
import { normalizeRegionId } from './venezuela-map.js';

export { STATE_MAPS, type StateMapInfo };

const cache = new Map<string, Promise<RegionMapGeometry>>();

/**
 * Loads the municipality map of one state — by id (`VE-V`), name (`Zulia`) or any alias
 * `normalizeRegionId` understands — as a `RegionMapGeometry` for `buildMapModel()`. Each state
 * lives in its own chunk (10–50 KB) and is fetched once; the promise is cached. Rejects with an
 * `Error` for unknown states.
 *
 * Every map has the state capital as `capital` (none for Dependencias Federales and Guayana
 * Esequiba) and the municipal seat as `regions[].capital` where GeoNames has it (332 of 335).
 * Distrito Capital, La Guaira, Dependencias Federales and Guayana Esequiba are single-region maps.
 */
export function loadStateMap(state: string): Promise<RegionMapGeometry> {
  const id = normalizeRegionId(state);
  const loader = id ? STATE_MAP_LOADERS[id] : undefined;
  if (!id || !loader) return Promise.reject(new Error(`Unknown state "${state}"`));
  let pending = cache.get(id);
  if (!pending) {
    pending = loader();
    cache.set(id, pending);
    pending.catch(() => cache.delete(id));
  }
  return pending;
}

/** Whether `loadStateMap()` knows that state (same inputs as `normalizeRegionId`). */
export function hasStateMap(state: string): boolean {
  const id = normalizeRegionId(state);
  return id !== undefined && id in STATE_MAP_LOADERS;
}
