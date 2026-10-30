// Builds `packages/core/src/data/venezuela.ts` from Natural Earth (public domain):
//   - ne_10m_admin_1_states_provinces  → the 23 states, Distrito Capital and Dependencias Federales
//   - ne_10m_admin_0_disputed_areas    → "West of Essequibo River" = the state of Guayana Esequiba
//
// Why a custom pipeline instead of a ready-made SVG: licensing (Wikimedia maps are CC-BY-SA, this
// library is MIT), shared borders (states are split into shared arcs before simplification, so
// neighbours never overlap or leave slivers — the TopoJSON idea in ~80 lines) and a projection we
// control (`projectVenezuela()` in the core reuses the exact same parameters for markers).
//
// Usage: node.exe packages/core/scripts/build-venezuela-map.mjs [--tolerance=0.6] [--width=800]
// Downloads are cached in $KC_GEO_CACHE (default: ./.geo-cache, git-ignored).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);
const TOLERANCE = Number(args.tolerance ?? 0.6); // px at the chosen viewBox width
const WIDTH = Number(args.width ?? 800);
const cacheDir = process.env.KC_GEO_CACHE ?? join(here, '..', '.geo-cache');
mkdirSync(cacheDir, { recursive: true });

const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const SOURCES = {
  admin1: 'ne_10m_admin_1_states_provinces.geojson',
  disputed: 'ne_10m_admin_0_disputed_areas.geojson',
};

async function load(name) {
  const file = join(cacheDir, SOURCES[name]);
  if (!existsSync(file)) {
    console.log(`downloading ${SOURCES[name]}…`);
    const res = await fetch(NE + SOURCES[name]);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${SOURCES[name]}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

// ---------------------------------------------------------------------------------------------
// 1. Select features
// ---------------------------------------------------------------------------------------------
const NAME_OVERRIDES = { 'VE-X': 'La Guaira' }; // renamed from Vargas in 2019
const SHORT_NAMES = {
  'VE-A': 'Dtto. Capital',
  'VE-W': 'Dep. Federales',
  'VE-O': 'N. Esparta',
  'VE-Y': 'Delta Amacuro',
  'VE-GE': 'G. Esequiba',
};
const MAX_LAT = 13; // drops Isla de Aves (15.7° N): it would triple the map height for a dot

// State capitals (Dependencias Federales has no capital; its seat, Gran Roque, is omitted).
const CAPITALS = {
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

const admin1 = await load('admin1');
const disputed = await load('disputed');

const states = admin1.features
  .filter((f) => f.properties.adm0_a3 === 'VEN' && /^VE-[A-Z]$/.test(f.properties.iso_3166_2))
  .map((f) => ({
    id: f.properties.iso_3166_2,
    name: NAME_OVERRIDES[f.properties.iso_3166_2] ?? f.properties.name,
    polygons: toPolygons(f.geometry).filter((poly) => centroid(poly[0])[1] < MAX_LAT),
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

// Guayana Esequiba is a Venezuelan state (Ley Orgánica para la Defensa de la Guayana Esequiba,
// 2024). ISO 3166-2 has no code for it yet, so the library uses `VE-GE`. Natural Earth only ships
// its outline in the "disputed areas" layer, which is why it is read from there and then treated
// exactly like the other states.
const esequibaFeature = disputed.features.find(
  (f) => f.properties.BRK_NAME === 'West of Essequibo River',
);
if (!esequibaFeature) throw new Error('Guayana Esequiba not found in the disputed areas layer');
states.push({
  id: 'VE-GE',
  name: 'Guayana Esequiba',
  polygons: toPolygons(esequibaFeature.geometry),
});
states.sort((a, b) => a.id.localeCompare(b.id));

const regions = states;
console.log(
  `${states.length} regions (states, Distrito Capital, Dependencias Federales, Guayana Esequiba)`,
);

// ---------------------------------------------------------------------------------------------
// 2. Projection (equirectangular with latitude correction; Venezuela spans 0.6°–12.2° N)
// ---------------------------------------------------------------------------------------------
let minLng = Infinity;
let maxLng = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;
for (const region of regions) {
  for (const poly of region.polygons) {
    for (const [lng, lat] of poly[0]) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
}
const PAD = 0.15; // degrees
minLng -= PAD;
maxLng += PAD;
minLat -= PAD;
maxLat += PAD;
const latMid = (minLat + maxLat) / 2;
const cosMid = Math.cos((latMid * Math.PI) / 180);
const scale = WIDTH / ((maxLng - minLng) * cosMid);
const HEIGHT = Math.round((maxLat - minLat) * scale);
const project = ([lng, lat]) => [(lng - minLng) * cosMid * scale, (maxLat - lat) * scale];

// ---------------------------------------------------------------------------------------------
// 3. Shared arcs: split every ring where the set of rings sharing an edge changes
// ---------------------------------------------------------------------------------------------
const rings = []; // { ringId, regionIndex, polyIndex, ringIndex, coords }
regions.forEach((region, regionIndex) => {
  region.polygons.forEach((poly, polyIndex) => {
    poly.forEach((coords, ringIndex) => {
      rings.push({
        ringId: rings.length,
        regionIndex,
        polyIndex,
        ringIndex,
        coords: dedupe(coords),
      });
    });
  });
});

const key = (p) => `${p[0]},${p[1]}`;
const edgeKey = (a, b) => {
  const ka = key(a);
  const kb = key(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};
const edgeRings = new Map();
for (const ring of rings) {
  const c = ring.coords;
  for (let i = 0; i < c.length - 1; i++) {
    const k = edgeKey(c[i], c[i + 1]);
    let set = edgeRings.get(k);
    if (!set) edgeRings.set(k, (set = new Set()));
    set.add(ring.ringId);
  }
}
const signature = (a, b) => [...edgeRings.get(edgeKey(a, b))].sort((x, y) => x - y).join('|');

const arcs = []; // unique arcs (arrays of [lng, lat])
const arcIndex = new Map();
let sharedArcs = 0;
for (const ring of rings) {
  const c = ring.coords;
  const m = c.length - 1; // edges
  const sigs = [];
  for (let i = 0; i < m; i++) sigs.push(signature(c[i], c[i + 1]));
  const cuts = [];
  for (let i = 0; i < m; i++) if (sigs[(i - 1 + m) % m] !== sigs[i]) cuts.push(i);
  if (cuts.length === 0) cuts.push(0);
  ring.arcs = [];
  for (let n = 0; n < cuts.length; n++) {
    const start = cuts[n];
    const end = cuts[(n + 1) % cuts.length];
    const pts = [];
    for (let i = start; ; i = (i + 1) % m) {
      pts.push(c[i]);
      if (i === end && pts.length > 1) break;
      if (pts.length > m + 1) break; // safety
    }
    if (cuts.length === 1) pts.push(c[start]); // whole ring: close it
    const forward = pts.map(key).join(';');
    const backward = [...pts].reverse().map(key).join(';');
    let idx = arcIndex.get(forward);
    let reversed = false;
    if (idx === undefined && arcIndex.has(backward)) {
      idx = arcIndex.get(backward);
      reversed = true;
      sharedArcs++;
    }
    if (idx === undefined) {
      idx = arcs.length;
      arcs.push(pts);
      arcIndex.set(forward, idx);
    }
    ring.arcs.push({ idx, reversed });
  }
}
console.log(
  `${rings.length} rings → ${arcs.length} unique arcs (${sharedArcs} shared borders reused)`,
);

// ---------------------------------------------------------------------------------------------
// 4. Simplify each arc once (Douglas–Peucker in pixel space, endpoints fixed)
// ---------------------------------------------------------------------------------------------
const projectedArcs = arcs.map((arc) => simplify(arc.map(project), TOLERANCE));
const pointsBefore = arcs.reduce((n, a) => n + a.length, 0);
const pointsAfter = projectedArcs.reduce((n, a) => n + a.length, 0);
console.log(`points ${pointsBefore} → ${pointsAfter} (tolerance ${TOLERANCE}px @ ${WIDTH}px)`);

// ---------------------------------------------------------------------------------------------
// 5. Rebuild rings → path per region, label point from the largest polygon
// ---------------------------------------------------------------------------------------------
const output = regions.map((region, regionIndex) => {
  const regionRings = rings.filter((r) => r.regionIndex === regionIndex);
  let d = '';
  let best = { area: -1, centroid: [0, 0] };
  for (const ring of regionRings) {
    const pts = [];
    ring.arcs.forEach(({ idx, reversed }, n) => {
      const arc = reversed ? [...projectedArcs[idx]].reverse() : projectedArcs[idx];
      for (let i = n === 0 ? 0 : 1; i < arc.length; i++) pts.push(arc[i]);
    });
    if (pts.length >= 2 && same(pts[0], pts[pts.length - 1])) pts.pop();
    if (pts.length < 3) continue;
    d += 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(' ') + 'Z';
    if (ring.ringIndex === 0) {
      const area = Math.abs(polygonArea(pts));
      if (area > best.area) best = { area, centroid: polygonCentroid(pts) };
    }
  }
  return {
    id: region.id,
    name: region.name,
    short: SHORT_NAMES[region.id] ?? region.name,
    path: d,
    labelX: Number(best.centroid[0].toFixed(1)),
    labelY: Number(best.centroid[1].toFixed(1)),
    ...(CAPITALS[region.id]
      ? {
          capital: {
            name: CAPITALS[region.id][0],
            lat: CAPITALS[region.id][1],
            lng: CAPITALS[region.id][2],
          },
        }
      : {}),
  };
});

const ts = `// AUTO-GENERATED by scripts/build-venezuela-map.mjs — do not edit by hand.
// Geometry: Natural Earth 10m (public domain). The 23 states, Distrito Capital, Dependencias
// Federales and the state of Guayana Esequiba (outline from the "disputed areas" layer, drawn as
// a regular state as Venezuelan law establishes).
// Projection: equirectangular, lon/lat → px with the parameters below (see projectVenezuela()).
// Simplified with shared borders (tolerance ${TOLERANCE}px at ${WIDTH}px wide).

export interface MapRegionGeometry {
  /** ISO 3166-2 code, e.g. \`VE-V\` (\`VE-GE\` for Guayana Esequiba, which has no ISO code). */
  id: string;
  name: string;
  /** Short label for small maps. */
  short: string;
  /** SVG path in viewBox coordinates. */
  path: string;
  /** Label anchor (centroid of the largest polygon). */
  labelX: number;
  labelY: number;
  /** State capital (absent for Dependencias Federales and Guayana Esequiba). */
  capital?: { name: string; lat: number; lng: number };
}

export const VENEZUELA_VIEWBOX = { width: ${WIDTH}, height: ${HEIGHT} } as const;

export const VENEZUELA_PROJECTION = {
  minLng: ${minLng},
  maxLat: ${maxLat},
  cosMid: ${cosMid},
  scale: ${scale},
} as const;

/** The 26 regions of the Venezuelan map, sorted by id. */
export const VENEZUELA_STATES: readonly MapRegionGeometry[] = ${JSON.stringify(output, null, 2)};
`;

const outFile = join(here, '..', 'src', 'data', 'venezuela.ts');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, ts);
console.log(
  `wrote ${outFile} (${(Buffer.byteLength(ts) / 1024).toFixed(1)} KB), viewBox ${WIDTH}×${HEIGHT}`,
);

// Preview for eyeballing: node … --preview=C:/path/preview.svg
if (args.preview) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" style="background:#fff;font:10px sans-serif">
${output.map((r, i) => `<path d="${r.path}" fill="hsl(${(i * 37) % 360} 60% 70%)" stroke="#fff" stroke-width="1"/>`).join('\n')}
${output.map((r) => `<text x="${r.labelX}" y="${r.labelY}" text-anchor="middle" dominant-baseline="middle" fill="#111">${r.short}</text>`).join('\n')}
</svg>`;
  writeFileSync(args.preview, svg);
  console.log(`preview → ${args.preview}`);
}

// ---------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------
function toPolygons(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  throw new Error(`Unsupported geometry ${geometry.type}`);
}

function dedupe(coords) {
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    if (!same(coords[i], out[out.length - 1])) out.push(coords[i]);
  }
  if (!same(out[0], out[out.length - 1])) out.push(out[0]);
  return out;
}

function same(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function centroid(ring) {
  let x = 0;
  let y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

function polygonArea(pts) {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return area / 2;
}

function polygonCentroid(pts) {
  const area = polygonArea(pts);
  if (Math.abs(area) < 1e-9) return centroid(pts);
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const f = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    cx += (pts[j][0] + pts[i][0]) * f;
    cy += (pts[j][1] + pts[i][1]) * f;
  }
  return [cx / (6 * area), cy / (6 * area)];
}

/** Douglas–Peucker keeping both endpoints; closed arcs are split at their farthest point. */
function simplify(pts, tolerance) {
  if (pts.length <= 2) return pts;
  if (same(pts[0], pts[pts.length - 1]) && pts.length > 3) {
    let far = 1;
    let best = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = dist2(pts[0], pts[i]);
      if (d > best) {
        best = d;
        far = i;
      }
    }
    const a = simplify(pts.slice(0, far + 1), tolerance);
    const b = simplify(pts.slice(far), tolerance);
    return [...a, ...b.slice(1)];
  }
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const tol2 = tolerance * tolerance;
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = segmentDist2(pts[i], pts[s], pts[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx !== -1 && maxD > tol2) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function dist2(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
}

function segmentDist2(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist2(p, a);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, [a[0] + t * dx, a[1] + t * dy]);
}

function fmt(n) {
  return String(Math.round(n * 10) / 10);
}
