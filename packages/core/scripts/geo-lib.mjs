// Shared geometry pipeline of the map generators (`build-venezuela-map.mjs`, `build-state-maps.mjs`).
//
// `buildRegionMap()` turns lon/lat polygons into SVG paths for one map: it projects them with an
// equirectangular projection fitted to the map (latitude-corrected), splits every ring into arcs
// shared by neighbouring regions BEFORE simplifying (so simplified neighbours never overlap or
// leave slivers — the TopoJSON idea in ~80 lines), simplifies each arc once (Douglas–Peucker in
// pixel space) and rebuilds one `<path d>` per region with a label point on its largest polygon.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Downloads `url` once into `cacheDir/<file>` and returns the parsed JSON. */
export async function loadJson(cacheDir, file, url) {
  mkdirSync(cacheDir, { recursive: true });
  const path = join(cacheDir, file);
  if (!existsSync(path)) {
    console.log(`downloading ${file}…`);
    const res = await fetch(url, { headers: { 'user-agent': 'kai-charts-geo/1.0' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * @param regions `{ id, name, short, polygons, capital?, code? }[]`; `polygons` = GeoJSON
 *   MultiPolygon coordinates (`[polygon][ring][point]`, lon/lat).
 * @param options `width` (viewBox width, px), `tolerance` (px at that width), `padDeg`
 *   (padding around the bounds, degrees).
 * @returns `{ width, height, projection, regions, stats }` with `regions[].path` in px.
 */
export function buildRegionMap(regions, { width = 800, tolerance = 0.6, padDeg = 0.15 } = {}) {
  // 1. Projection (equirectangular with latitude correction)
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
  minLng -= padDeg;
  maxLng += padDeg;
  minLat -= padDeg;
  maxLat += padDeg;
  const latMid = (minLat + maxLat) / 2;
  const cosMid = Math.cos((latMid * Math.PI) / 180);
  const scale = width / ((maxLng - minLng) * cosMid);
  const height = Math.round((maxLat - minLat) * scale);
  const project = ([lng, lat]) => [(lng - minLng) * cosMid * scale, (maxLat - lat) * scale];

  // 2. Shared arcs: split every ring where the set of rings sharing an edge changes
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

  // 3. Simplify each arc once (endpoints fixed)
  const projectedArcs = arcs.map((arc) => simplify(arc.map(project), tolerance));
  const pointsBefore = arcs.reduce((n, a) => n + a.length, 0);
  const pointsAfter = projectedArcs.reduce((n, a) => n + a.length, 0);

  // 4. Rebuild rings → path per region, label point from the largest polygon
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
      short: region.short ?? region.name,
      ...(region.code ? { code: region.code } : {}),
      path: d,
      labelX: Number(best.centroid[0].toFixed(1)),
      labelY: Number(best.centroid[1].toFixed(1)),
      ...(region.capital ? { capital: region.capital } : {}),
    };
  });

  return {
    width,
    height,
    projection: { minLng, maxLat, cosMid, scale },
    regions: output,
    stats: { rings: rings.length, arcs: arcs.length, sharedArcs, pointsBefore, pointsAfter },
  };
}

/** Writes an SVG with one colour per region and the short labels, for eyeballing. */
export function writePreview(file, map) {
  const { width, height, regions } = map;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#fff;font:10px sans-serif">
${regions.map((r, i) => `<path d="${r.path}" fill="hsl(${(i * 37) % 360} 60% 70%)" stroke="#fff" stroke-width="1"/>`).join('\n')}
${regions.map((r) => `<text x="${r.labelX}" y="${r.labelY}" text-anchor="middle" dominant-baseline="middle" fill="#111">${escapeXml(r.short)}</text>`).join('\n')}
${regions
  .filter((r) => r.capital)
  .map((r) => {
    const [x, y] = projectPoint(map.projection, r.capital.lat, r.capital.lng);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="#111"/>`;
  })
  .join('\n')}
</svg>`;
  writeFileSync(file, svg);
}

/** Lon/lat → px with a map projection (same formula as `projectPoint()` in the core). */
export function projectPoint({ minLng, maxLat, cosMid, scale }, lat, lng) {
  return [(lng - minLng) * cosMid * scale, (maxLat - lat) * scale];
}

export function toPolygons(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  throw new Error(`Unsupported geometry ${geometry.type}`);
}

/** Ray casting on the outer ring of every polygon (holes ignored). */
export function polygonsContain(polygons, [x, y]) {
  for (const poly of polygons) {
    const ring = poly[0];
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

export function centroid(ring) {
  let x = 0;
  let y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

/** Lowercase, no accents, no punctuation: `Dtto. Capital` → `dtto capital`. */
export function fold(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slug(text) {
  return fold(text).replace(/ /g, '-');
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
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

export function polygonArea(pts) {
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
