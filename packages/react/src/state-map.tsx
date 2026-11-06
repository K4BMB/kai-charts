import { useEffect, useState } from 'react';
import { hasStateMap, loadStateMap, type RegionMapGeometry } from 'kai-charts-core';
import { RegionMap, type RegionMapProps } from './region-map';

export interface StateMapProps extends RegionMapProps {
  /** State id (`VE-V`), name (`Zulia`) or alias (`Esequibo`); loaded with `loadStateMap()`. */
  state?: string;
  /** Preloaded geometry (`await loadStateMap(…)`): rendered synchronously, `state` is ignored. */
  geometry?: RegionMapGeometry;
  /** Header of the first column of the mirror table. Default `Municipio`. */
  regionHeader?: string;
  /** Text of the empty state shown when `state` is unknown or its chunk fails to load. */
  unknownStateText?: string;
}

export type StateMapStatus = 'loading' | 'ready' | 'unknown';

/**
 * Resolves the geometry of a state map: the preloaded one when given, otherwise the chunk
 * loaded with `loadStateMap(state)` (cached by the core). A change of `state` while a chunk is in
 * flight makes the old response stale (request token), so the map never shows the wrong state.
 */
export function useStateMap(
  state: string,
  geometry?: RegionMapGeometry,
): { geometry: RegionMapGeometry | null; status: StateMapStatus } {
  const [loaded, setLoaded] = useState<{ state: string; geometry: RegionMapGeometry } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const known = hasStateMap(state);

  useEffect(() => {
    if (geometry || !known) return undefined;
    let stale = false;
    loadStateMap(state).then(
      (result) => {
        if (!stale) setLoaded({ state, geometry: result });
      },
      () => {
        if (!stale) setFailed(state);
      },
    );
    return () => {
      stale = true;
    };
  }, [state, geometry, known]);

  if (geometry) return { geometry, status: 'ready' };
  if (!known || failed === state) return { geometry: null, status: 'unknown' };
  if (loaded?.state === state) return { geometry: loaded.geometry, status: 'ready' };
  return { geometry: null, status: 'loading' };
}

/**
 * The Venezuela map one level down: **one state, filled in municipality by municipality**. Same
 * props, DOM and behaviour as `VenezuelaMap` (both render `RegionMap`); the geometry of the state
 * is a lazy chunk loaded the first time it is shown (skeleton meanwhile), or passed preloaded
 * through `geometry` for a synchronous render. The only dot by default is the state capital; the
 * municipal seats read in the tooltip (`Capital = …`) and are drawn only with `showSeats`.
 *
 * ```tsx
 * <StateMap state="Zulia" data={byMunicipality} valueHeader="Ciudadanos" />
 * ```
 */
export function StateMap({
  state = '',
  geometry: preloaded,
  regionHeader = 'Municipio',
  unknownStateText = 'Estado no disponible',
  ...props
}: StateMapProps) {
  const { geometry, status } = useStateMap(state, preloaded);
  return (
    <RegionMap
      geometry={geometry}
      emptyMessage={status === 'unknown' ? unknownStateText : undefined}
      regionHeader={regionHeader}
      {...props}
    />
  );
}
