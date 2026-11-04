// Builds one municipality map per Venezuelan region into `packages/core/src/data/states/`:
// 24 states + Distrito Capital + Dependencias Federales + Guayana Esequiba = 26 files, plus an
// index with lazy loaders (`STATE_MAP_LOADERS`) so a consumer only downloads the states it shows.
//
// Sources (all redistributable with attribution, compatible with this MIT library):
//   - Municipality polygons: OCHA Common Operational Dataset for Venezuela (INE boundaries),
//     via the geoBoundaries "gbHumanitarian" release — CC BY 3.0 IGO.
//     https://data.humdata.org/dataset/cod-ab-ven · https://www.geoboundaries.org
//   - Official municipality names with accents, INE codes and municipal seats (capitals, with
//     coordinates): GeoNames — CC BY 4.0. https://www.geonames.org
//   - Outlines of Dependencias Federales and Guayana Esequiba (no municipal division in the COD;
//     Guayana Esequiba has no official municipal division yet): Natural Earth, public domain.
//
// Usage: node.exe packages/core/scripts/build-state-maps.mjs [--tolerance=0.6] [--width=800]
//        [--preview-dir=C:/path] [--only=VE-V]
// Downloads are cached in $KC_GEO_CACHE (default: ./.geo-cache, git-ignored).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import {
  buildRegionMap,
  centroid,
  fold,
  loadJson,
  polygonArea,
  polygonsContain,
  slug,
  toPolygons,
  writePreview,
} from './geo-lib.mjs';
import { MAX_LAT, NATURAL_EARTH, capitalOf, venezuelaStates } from './venezuela-constants.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const TOLERANCE = Number(args.tolerance ?? 0.6);
const WIDTH = Number(args.width ?? 800);
const ONLY = args.only ? new Set(args.only.split(',')) : null;
const cacheDir = process.env.KC_GEO_CACHE ?? join(here, '..', '.geo-cache');
mkdirSync(cacheDir, { recursive: true });

const GB = 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbHumanitarian/VEN/';
const GEONAMES_URL = 'https://download.geonames.org/export/dump/VE.zip';
const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'el', 'san', 'santa', 'santo']);
/** Municipalities renamed after the COD snapshot: COD name (folded) → current GeoNames name. */
const COD_RENAMES = {
  'VE-V|paez': 'guajira', // Páez → Guajira
  'VE-F|raul leoni': 'angostura', // Raúl Leoni → Angostura
  'VE-H|falcon': 'tinaquillo', // Falcón → Tinaquillo
};

// ---------------------------------------------------------------------------------------------
// 1. Load sources
// ---------------------------------------------------------------------------------------------
const neAdmin1 = await loadJson(cacheDir, NATURAL_EARTH.admin1.file, NATURAL_EARTH.admin1.url);
const neDisputed = await loadJson(
  cacheDir,
  NATURAL_EARTH.disputed.file,
  NATURAL_EARTH.disputed.url,
);
const STATES = venezuelaStates(neAdmin1, neDisputed, { toPolygons, centroid });
const stateById = new Map(STATES.map((s) => [s.id, s]));
const stateByFold = new Map(STATES.map((s) => [fold(s.name), s.id]));
const COD_STATE_ALIASES = { 'distrito federal': 'VE-A', vargas: 'VE-X' };

const codAdm1 = await loadJson(
  cacheDir,
  'gbh-VEN-ADM1.geojson',
  GB + 'ADM1/geoBoundaries-VEN-ADM1.geojson',
);
const codAdm2 = await loadJson(
  cacheDir,
  'gbh-VEN-ADM2.geojson',
  GB + 'ADM2/geoBoundaries-VEN-ADM2.geojson',
);
const geonames = await loadGeonames();

// ---------------------------------------------------------------------------------------------
// 2. COD states → our ids; COD municipalities → parent state (point-in-polygon on sampled vertices)
// ---------------------------------------------------------------------------------------------
const codStates = codAdm1.features.map((f) => {
  const name = fold(f.properties.shapeName);
  const id = COD_STATE_ALIASES[name] ?? stateByFold.get(name);
  if (!id) throw new Error(`COD state "${f.properties.shapeName}" not recognised`);
  return { id, polygons: toPolygons(f.geometry) };
});

const municipalitiesByState = new Map();
for (const f of codAdm2.features) {
  const polygons = toPolygons(f.geometry);
  const parent = parentState(polygons);
  if (!parent) throw new Error(`No parent state for municipality "${f.properties.shapeName}"`);
  if (!municipalitiesByState.has(parent)) municipalitiesByState.set(parent, []);
  municipalitiesByState.get(parent).push({ codName: f.properties.shapeName, polygons });
}

// ---------------------------------------------------------------------------------------------
// 3. GeoNames: official names, INE codes and seats per state
// ---------------------------------------------------------------------------------------------
const gnStateIds = new Map(); // GeoNames admin1 code → our id
for (const r of geonames.filter((r) => r.featureCode === 'ADM1')) {
  const name = fold(r.name.replace(/^Estado\s+/i, ''));
  const id = stateByFold.get(name);
  if (id) gnStateIds.set(r.admin1, id);
}
const seats = new Map(); // admin2 code → { name, lat, lng }
for (const code of ['PPLA2', 'PPLA', 'PPLC']) {
  for (const r of geonames.filter((r) => r.featureCode === code)) {
    if (r.admin2 && !seats.has(r.admin2))
      seats.set(r.admin2, { name: r.name, lat: r.lat, lng: r.lng });
  }
}
// Seats GeoNames does not flag as administrative seats, looked up by name among its places
// (Colonia Tovar is listed as plain "Tovar" there).
const MANUAL_SEATS = { 'VE-E|sosa': 'Ciudad de Nutrias', 'VE-D|tovar': 'Tovar' };
const SEAT_DISPLAY_NAMES = { 'VE-D|tovar': 'Colonia Tovar' };
const gnMunicipalities = new Map(); // our state id → [{ name, code, seat }]
for (const r of geonames.filter((r) => r.featureCode === 'ADM2')) {
  const stateId = gnStateIds.get(r.admin1);
  if (!stateId) continue;
  const name = r.name
    .replace(/^Municipio\s+/i, '')
    .replace(/^Aut[oó]nomo\s+/i, '')
    .replace(/^Bolivariano\s+/i, '');
  let seat = seats.get(r.admin2);
  const manual = MANUAL_SEATS[`${stateId}|${slug(name)}`];
  if (!seat && manual) {
    const place = geonames.find(
      (p) => p.featureClass === 'P' && p.admin2 === r.admin2 && fold(p.name) === fold(manual),
    );
    if (place) {
      const display = SEAT_DISPLAY_NAMES[`${stateId}|${slug(name)}`] ?? place.name;
      seat = { name: display, lat: place.lat, lng: place.lng };
    }
  }
  if (!gnMunicipalities.has(stateId)) gnMunicipalities.set(stateId, []);
  gnMunicipalities.get(stateId).push({ name, code: r.admin2, seat });
}

// ---------------------------------------------------------------------------------------------
// 4. Build one map per region
// ---------------------------------------------------------------------------------------------
const outDir = join(here, '..', 'src', 'data', 'states');
if (!ONLY) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
if (args['preview-dir']) mkdirSync(args['preview-dir'], { recursive: true });

const summary = [];
let unmatched = 0;
for (const state of STATES) {
  if (ONLY && !ONLY.has(state.id)) continue;
  let regions;
  let note = '';
  const cod = municipalitiesByState.get(state.id);
  if (cod) {
    const gn = [...(gnMunicipalities.get(state.id) ?? [])];
    regions = cod.map(({ codName, polygons }) => {
      const match = matchMunicipality(codName, gn, state.id);
      if (!match) {
        unmatched++;
        console.warn(`  ! ${state.name}: no GeoNames match for "${codName}"`);
        const name = codName;
        return { id: slug(name), name, short: shortName(name), polygons };
      }
      gn.splice(gn.indexOf(match), 1); // each GeoNames municipality matches once
      const seat = validSeat(match.seat, polygons, state, `${state.name}/${match.name}`);
      return {
        id: slug(match.name),
        name: match.name,
        short: shortName(match.name),
        code: match.code,
        polygons,
        ...(seat ? { capital: seat } : {}),
      };
    });
    if (gn.length) note = ` (GeoNames extra: ${gn.map((g) => g.name).join(', ')})`;
  } else {
    // No municipal division available: the whole region is the only area of its map.
    regions = [
      {
        id: slug(state.name),
        name: state.name,
        short: state.short,
        polygons: state.polygons.filter((poly) => centroid(poly[0])[1] < MAX_LAT),
      },
    ];
    note = ' (single region)';
  }
  regions.sort((a, b) => a.id.localeCompare(b.id));
  const ids = new Set(regions.map((r) => r.id));
  if (ids.size !== regions.length) throw new Error(`${state.name}: duplicate municipality ids`);

  const padDeg = 0.03 * extent(regions);
  const map = buildRegionMap(regions, { width: WIDTH, tolerance: TOLERANCE, padDeg });
  const fileId = state.id.toLowerCase();
  const constName = state.id.replace('-', '_');
  const geometry = {
    id: state.id,
    name: state.name,
    viewBox: { width: map.width, height: map.height },
    projection: map.projection,
    ...(capitalOf(state.id) ? { capital: capitalOf(state.id) } : {}),
    regions: map.regions,
  };
  const ts = `// AUTO-GENERATED by scripts/build-state-maps.mjs — do not edit by hand.
// ${state.name} (${state.id}): ${map.regions.length} ${cod ? 'municipalities' : 'region'}, viewBox ${map.width}×${map.height}.
// Polygons: OCHA COD for Venezuela via geoBoundaries gbHumanitarian (CC BY 3.0 IGO)${cod ? '' : ' — outline from Natural Earth (public domain)'}.
// Names, INE codes and municipal seats: GeoNames (CC BY 4.0). Tolerance ${TOLERANCE}px at ${WIDTH}px wide.
import type { RegionMapGeometry } from '../map-types.js';

const ${constName}: RegionMapGeometry = ${JSON.stringify(geometry, null, 2)};

export default ${constName};
`;
  writeFileSync(join(outDir, `${fileId}.ts`), ts);
  if (args['preview-dir']) writePreview(join(args['preview-dir'], `${fileId}.svg`), map);
  const withSeat = map.regions.filter((r) => r.capital).length;
  summary.push({ id: state.id, name: state.name, regions: map.regions.length });
  console.log(
    `${state.id.padEnd(5)} ${state.name.padEnd(22)} ${String(map.regions.length).padStart(2)} regions, ${withSeat} seats, ${map.stats.pointsAfter} pts, ${(Buffer.byteLength(ts) / 1024).toFixed(1)} KB${note}`,
  );
}
if (unmatched) console.warn(`${unmatched} municipalities without a GeoNames match`);

// ---------------------------------------------------------------------------------------------
// 5. Index with lazy loaders
// ---------------------------------------------------------------------------------------------
if (!ONLY) {
  summary.sort((a, b) => a.id.localeCompare(b.id));
  const index = `// AUTO-GENERATED by scripts/build-state-maps.mjs — do not edit by hand.
import type { RegionMapGeometry } from '../map-types.js';

export interface StateMapInfo {
  /** State id as on the national map (\`VE-V\`). */
  id: string;
  name: string;
  /** Number of regions (municipalities) on that map. */
  regions: number;
}

/** The 26 state maps, sorted by id. */
export const STATE_MAPS: readonly StateMapInfo[] = [
${summary.map((s) => `  { id: '${s.id}', name: '${s.name}', regions: ${s.regions} },`).join('\n')}
];

/** Lazy loader per state: bundlers split each map into its own chunk (10–60 KB). */
export const STATE_MAP_LOADERS: Readonly<Record<string, () => Promise<RegionMapGeometry>>> = {
${summary.map((s) => `  '${s.id}': () => import('./${s.id.toLowerCase()}.js').then((m) => m.default),`).join('\n')}
};
`;
  writeFileSync(join(outDir, 'index.ts'), index);
  console.log(`wrote ${summary.length} state maps + index to ${outDir}`);
}

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
function parentState(polygons) {
  // Interior points (grid over the largest polygon's bbox, kept when inside it) — never its
  // vertices: border municipalities have half their vertices ON the state line, where the test
  // against the neighbouring state is a coin toss. The state containing most points wins.
  const largest = polygons.reduce((a, b) =>
    Math.abs(polygonArea(b[0])) > Math.abs(polygonArea(a[0])) ? b : a,
  );
  const ring = largest[0];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const votes = new Map();
  const N = 24;
  let inside = 0;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= N; j++) {
      const p = [
        minX + ((maxX - minX) * (i + 0.5)) / (N + 1),
        minY + ((maxY - minY) * (j + 0.5)) / (N + 1),
      ];
      if (!polygonsContain([largest], p)) continue;
      inside++;
      for (const s of codStates) {
        if (polygonsContain(s.polygons, p)) votes.set(s.id, (votes.get(s.id) ?? 0) + 1);
      }
    }
  }
  if (inside === 0) {
    const c = centroid(ring);
    for (const s of codStates) if (polygonsContain(s.polygons, c)) votes.set(s.id, 1);
  }
  let best = null;
  for (const [id, n] of votes) if (!best || n > best.n) best = { id, n };
  return best?.id ?? null;
}

/** COD names are ASCII and truncated to 18 chars: exact fold, then prefix, then token overlap. */
function matchMunicipality(codName, candidates, stateId) {
  const raw = fold(codName.replace(/^Autonomo\s+/i, ''));
  const target = COD_RENAMES[`${stateId}|${raw}`] ?? raw;
  const exact = candidates.find((c) => fold(c.name) === target);
  if (exact) return exact;
  const prefix = candidates.filter((c) => fold(c.name).startsWith(target));
  if (prefix.length === 1) return prefix[0];
  const tokens = new Set(target.split(' '));
  let best = null;
  for (const c of candidates) {
    const ct = fold(c.name).split(' ');
    const common = ct.filter(
      (t) => tokens.has(t) || [...tokens].some((x) => t.startsWith(x)),
    ).length;
    const score = common / Math.max(ct.length, tokens.size);
    if (score >= 0.5 && (!best || score > best.score)) best = { c, score };
  }
  return best?.c ?? null;
}

/**
 * A seat must fall inside its municipality or the dot lands on a neighbour. State capitals use
 * the curated `CAPITALS` coordinates; a GeoNames point just outside (coastline, border precision)
 * is nudged towards the municipality; a point far outside is a GeoNames error (another place
 * with the same name) → look for a homonymous place inside the polygon, else drop the seat.
 */
function validSeat(seat, polygons, state, label) {
  if (!seat) return undefined;
  const inside = (p) => polygonsContain(polygons, p);
  if (state.capital && fold(seat.name) === fold(state.capital.name)) {
    const c = state.capital;
    if (inside([c.lng, c.lat])) return { name: c.name, lat: c.lat, lng: c.lng };
  }
  if (inside([seat.lng, seat.lat])) return seat;
  const homonym = geonames.find(
    (p) => p.featureClass === 'P' && fold(p.name) === fold(seat.name) && inside([p.lng, p.lat]),
  );
  if (homonym) {
    console.log(`  ~ ${label}: seat ${seat.name} relocated to the homonymous place inside`);
    return { name: seat.name, lat: homonym.lat, lng: homonym.lng };
  }
  const largest = polygons.reduce((a, b) =>
    Math.abs(polygonArea(b[0])) > Math.abs(polygonArea(a[0])) ? b : a,
  );
  const [cx, cy] = centroid(largest[0]);
  let [lng, lat] = [seat.lng, seat.lat];
  for (let step = 1; step <= 15; step++) {
    const k = 0.002 * step;
    const d = Math.hypot(cx - seat.lng, cy - seat.lat) || 1;
    lng = seat.lng + ((cx - seat.lng) / d) * k;
    lat = seat.lat + ((cy - seat.lat) / d) * k;
    if (inside([lng, lat])) {
      console.log(`  ~ ${label}: seat ${seat.name} nudged ${(k * 111).toFixed(1)} km inside`);
      return { name: seat.name, lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
    }
  }
  console.warn(`  ! ${label}: seat ${seat.name} is outside the municipality — dropped`);
  return undefined;
}

/** `Jesús Enrique Lossada` → `J. E. Lossada`; short names stay as they are. */
function shortName(name) {
  if (name.length <= 14) return name;
  const words = name.split(' ');
  if (words.length < 2) return name;
  return words
    .map((w, i) => (i === words.length - 1 || PARTICLES.has(w.toLowerCase()) ? w : w[0] + '.'))
    .join(' ');
}

function extent(regions) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const r of regions) {
    for (const poly of r.polygons) {
      for (const [lng, lat] of poly[0]) {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      }
    }
  }
  return Math.max(maxLng - minLng, maxLat - minLat);
}

/** GeoNames VE dump (tab-separated, no quoting) → rows with the columns we use. */
async function loadGeonames() {
  const zipPath = join(cacheDir, 'geonames-VE.zip');
  if (!existsSync(zipPath)) {
    console.log('downloading GeoNames VE.zip…');
    const res = await fetch(GEONAMES_URL, { headers: { 'user-agent': 'kai-charts-geo/1.0' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${GEONAMES_URL}`);
    writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
  }
  const text = unzipEntry(readFileSync(zipPath), 'VE.txt').toString('utf8');
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const c = line.split('\t');
      return {
        name: c[1],
        lat: Number(c[4]),
        lng: Number(c[5]),
        featureClass: c[6],
        featureCode: c[7],
        admin1: c[10],
        admin2: c[11],
      };
    });
}

/** Minimal ZIP reader (central directory → local header → stored/deflated entry). */
function unzipEntry(buf, entryName) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('ZIP: end of central directory not found');
  const entries = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < entries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP: bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLength);
    if (name === entryName) {
      const localNameLength = buf.readUInt16LE(localOffset + 26);
      const localExtraLength = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const data = buf.subarray(start, start + compressedSize);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data);
      throw new Error(`ZIP: unsupported method ${method}`);
    }
    p += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`ZIP: ${entryName} not found`);
}
