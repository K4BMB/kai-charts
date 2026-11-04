// Venezuela constants shared by the map generators: state capitals, naming overrides, filters.

/** Natural Earth renamed nothing; Vargas became La Guaira in 2019. */
export const NAME_OVERRIDES = { 'VE-X': 'La Guaira' };

export const SHORT_NAMES = {
  'VE-A': 'Dtto. Capital',
  'VE-W': 'Dep. Federales',
  'VE-O': 'N. Esparta',
  'VE-Y': 'Delta Amacuro',
  'VE-GE': 'G. Esequiba',
};

/** Drops Isla de Aves (15.7° N): it would triple the map height for a dot. */
export const MAX_LAT = 13;

/**
 * State capitals. Dependencias Federales has no capital (its seat, Gran Roque, is omitted) and
 * Guayana Esequiba's provisional capital, Tumeremo, lies in Bolívar territory, outside its map.
 */
export const CAPITALS = {
  'VE-A': ['Caracas', 10.4806, -66.9036],
  'VE-B': ['Barcelona', 10.1333, -64.6833],
  'VE-C': ['San Fernando de Apure', 7.8939, -67.4728],
  'VE-D': ['Maracay', 10.2469, -67.5958],
  'VE-E': ['Barinas', 8.6226, -70.2075],
  'VE-F': ['Ciudad Bolívar', 8.1222, -63.5497],
  'VE-G': ['Valencia', 10.162, -68.0077],
  'VE-H': ['San Carlos', 9.6612, -68.5827],
  'VE-I': ['Coro', 11.4045, -69.6734],
  'VE-J': ['San Juan de los Morros', 9.9111, -67.3539],
  'VE-K': ['Barquisimeto', 10.0678, -69.3467],
  'VE-L': ['Mérida', 8.5897, -71.1561],
  'VE-M': ['Los Teques', 10.3444, -67.0431],
  'VE-N': ['Maturín', 9.7457, -63.1832],
  'VE-O': ['La Asunción', 11.0333, -63.8628],
  'VE-P': ['Guanare', 9.0418, -69.7421],
  'VE-R': ['Cumaná', 10.4536, -64.1675],
  'VE-S': ['San Cristóbal', 7.7669, -72.225],
  'VE-T': ['Trujillo', 9.3659, -70.4367],
  'VE-U': ['San Felipe', 10.3399, -68.7425],
  'VE-V': ['Maracaibo', 10.6427, -71.6125],
  'VE-X': ['La Guaira', 10.6012, -66.9319],
  'VE-Y': ['Tucupita', 9.0583, -62.0506],
  'VE-Z': ['Puerto Ayacucho', 5.6639, -67.6236],
};

export const capitalOf = (id) =>
  CAPITALS[id] ? { name: CAPITALS[id][0], lat: CAPITALS[id][1], lng: CAPITALS[id][2] } : undefined;

const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
export const NATURAL_EARTH = {
  admin1: {
    file: 'ne_10m_admin_1_states_provinces.geojson',
    url: NE + 'ne_10m_admin_1_states_provinces.geojson',
  },
  disputed: {
    file: 'ne_10m_admin_0_disputed_areas.geojson',
    url: NE + 'ne_10m_admin_0_disputed_areas.geojson',
  },
};

/**
 * The 26 regions of the national map as `{ id, name, polygons }` (lon/lat) from Natural Earth:
 * 23 states + Distrito Capital + Dependencias Federales from the admin-1 layer and the state of
 * Guayana Esequiba (Ley Orgánica para la Defensa de la Guayana Esequiba, 2024; no ISO code yet,
 * the library uses `VE-GE`) from the "disputed areas" layer, treated exactly like the others.
 */
export function venezuelaStates(admin1, disputed, { toPolygons, centroid }) {
  const states = admin1.features
    .filter((f) => f.properties.adm0_a3 === 'VEN' && /^VE-[A-Z]$/.test(f.properties.iso_3166_2))
    .map((f) => ({
      id: f.properties.iso_3166_2,
      name: NAME_OVERRIDES[f.properties.iso_3166_2] ?? f.properties.name,
      polygons: toPolygons(f.geometry).filter((poly) => centroid(poly[0])[1] < MAX_LAT),
    }));
  const esequiba = disputed.features.find(
    (f) => f.properties.BRK_NAME === 'West of Essequibo River',
  );
  if (!esequiba) throw new Error('Guayana Esequiba not found in the disputed areas layer');
  states.push({ id: 'VE-GE', name: 'Guayana Esequiba', polygons: toPolygons(esequiba.geometry) });
  states.sort((a, b) => a.id.localeCompare(b.id));
  return states.map((s) => ({
    ...s,
    short: SHORT_NAMES[s.id] ?? s.name,
    capital: capitalOf(s.id),
  }));
}
