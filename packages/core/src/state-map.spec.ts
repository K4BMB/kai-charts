import { createValueFormatter } from './format.js';
import { STATE_MAPS, hasStateMap, loadStateMap } from './state-map.js';
import {
  VENEZUELA_STATES,
  buildMapModel,
  projectPoint,
  regionAnchor,
  resolveRegionId,
  type RegionMapGeometry,
} from './venezuela-map.js';

const es = createValueFormatter('es-VE');

/** Ray casting over every subpath (`M…Z`) of an absolute path. */
function pathContains(d: string, x: number, y: number): boolean {
  let inside = false;
  for (const sub of d.split('M').filter(Boolean)) {
    const pts = sub.replace('Z', '').trim().split(' ').map(Number);
    for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      const [xi, yi, xj, yj] = [pts[i], pts[i + 1], pts[j], pts[j + 1]];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

describe('state maps catalogue', () => {
  it('lists the 26 regions of the national map, sorted by id, with their municipality counts', () => {
    expect(STATE_MAPS.map((s) => s.id)).toEqual(VENEZUELA_STATES.map((s) => s.id));
    expect(STATE_MAPS.reduce((n, s) => n + s.regions, 0)).toBe(337); // 335 municipalities + 2
    const byId = Object.fromEntries(STATE_MAPS.map((s) => [s.id, s]));
    expect(byId['VE-V']).toEqual({ id: 'VE-V', name: 'Zulia', regions: 21 });
    expect(byId['VE-S'].regions).toBe(29); // Táchira, the most municipalities
    expect(byId['VE-A'].regions).toBe(1); // Distrito Capital: Libertador
    expect(byId['VE-X'].regions).toBe(1); // La Guaira: Vargas
    expect(byId['VE-W'].regions).toBe(1); // Dependencias Federales: no municipal division
    expect(byId['VE-GE']).toEqual({ id: 'VE-GE', name: 'Guayana Esequiba', regions: 1 });
  });

  it('knows a state by id, name or alias and rejects unknown ones', async () => {
    expect(hasStateMap('VE-V')).toBe(true);
    expect(hasStateMap('zulia')).toBe(true);
    expect(hasStateMap('Esequibo')).toBe(true);
    expect(hasStateMap('Vargas')).toBe(true);
    expect(hasStateMap('Narnia')).toBe(false);
    await expect(loadStateMap('Narnia')).rejects.toThrow('Unknown state "Narnia"');
  });

  it('caches the geometry: the same promise for the same state, whatever the spelling', () => {
    expect(loadStateMap('VE-V')).toBe(loadStateMap('Zulia'));
  });
});

describe('Zulia map', () => {
  let zulia: RegionMapGeometry;
  beforeAll(async () => {
    zulia = await loadStateMap('Zulia');
  });

  it('has 21 municipalities with unique slug ids, INE codes, names with accents and seats', () => {
    expect(zulia.id).toBe('VE-V');
    expect(zulia.name).toBe('Zulia');
    expect(zulia.viewBox.width).toBe(800);
    expect(zulia.viewBox.height).toBeGreaterThan(400);
    expect(zulia.regions).toHaveLength(21);
    expect(new Set(zulia.regions.map((r) => r.id)).size).toBe(21);
    for (const region of zulia.regions) {
      expect(region.id).toMatch(/^[a-z0-9-]+$/);
      expect(region.code).toMatch(/^\d{4}$/);
      expect(region.path.startsWith('M')).toBe(true);
      expect(region.capital).toBeDefined();
    }
    const maracaibo = zulia.regions.find((r) => r.id === 'maracaibo')!;
    expect(maracaibo.name).toBe('Maracaibo');
    expect(maracaibo.capital?.name).toBe('Maracaibo');
    expect(zulia.regions.find((r) => r.id === 'jesus-enrique-lossada')?.name).toBe(
      'Jesús Enrique Lossada',
    );
    expect(zulia.regions.find((r) => r.id === 'jesus-enrique-lossada')?.short).toBe(
      'J. E. Lossada',
    );
    // Renamed after the boundary snapshot: Páez → Guajira.
    expect(zulia.regions.some((r) => r.id === 'guajira')).toBe(true);
    expect(zulia.regions.some((r) => r.id === 'paez')).toBe(false);
  });

  it('has the state capital, inside the Maracaibo municipality', () => {
    expect(zulia.capital).toEqual({ name: 'Maracaibo', lat: 10.6427, lng: -71.6125 });
    const { x, y } = projectPoint(zulia.projection, zulia.capital!.lat, zulia.capital!.lng);
    const maracaibo = zulia.regions.find((r) => r.id === 'maracaibo')!;
    expect(pathContains(maracaibo.path, x, y)).toBe(true);
  });

  it('resolves municipalities by id, name (any accents/case), short name and INE code', () => {
    expect(resolveRegionId(zulia, 'maracaibo')).toBe('maracaibo');
    expect(resolveRegionId(zulia, 'Maracaibo')).toBe('maracaibo');
    expect(resolveRegionId(zulia, 'Jesus Enrique Lossada')).toBe('jesus-enrique-lossada');
    expect(resolveRegionId(zulia, 'J. E. Lossada')).toBe('jesus-enrique-lossada');
    const maracaibo = zulia.regions.find((r) => r.id === 'maracaibo')!;
    expect(resolveRegionId(zulia, maracaibo.code!)).toBe('maracaibo');
    expect(resolveRegionId(zulia, 'Zulia')).toBeUndefined(); // the state is not a region here
  });

  it('builds the model against the state geometry: fill, legend, capitals and anchors', () => {
    const maracaibo = zulia.regions.find((r) => r.id === 'maracaibo')!;
    const model = buildMapModel(
      [
        { id: 'Maracaibo', value: 5260 },
        { id: maracaibo.code!, value: 9999 }, // same region by code: last one wins
        { id: 'san francisco', value: 1200 },
        { id: 'Narnia', value: 1 },
      ],
      [],
      es,
      { geometry: zulia, highlight: ['Cabimas'] },
    );
    expect(model.total).toBe(21);
    expect(model.filled).toBe(2);
    expect(model.unmatched).toEqual(['Narnia']);
    const m = model.regions.find((r) => r.id === 'maracaibo')!;
    expect(m.value).toBe(9999);
    expect(m.opacity).toBe(1);
    expect(m.ariaLabel).toBe('Maracaibo: 9.999');
    expect(m.capitalPoint?.name).toBe('Maracaibo');
    expect(model.regions.find((r) => r.id === 'cabimas')?.highlighted).toBe(true);
    expect(model.legend).toMatchObject({ min: 1200, max: 9999, visible: true });
    expect(model.capital?.name).toBe('Maracaibo');
    expect(model.capital!.x).toBeGreaterThan(0);
    expect(model.capital!.y).toBeGreaterThan(0);
    // Anchor scales with the rendered width against THIS map's viewBox, not the national one.
    const anchor = regionAnchor(maracaibo, 400, zulia.viewBox.width);
    expect(anchor.x).toBeCloseTo(maracaibo.labelX / 2, 1);
  });
});

describe('every state map', () => {
  it('loads, has unique ids, draws every seat and state capital inside its own polygon', async () => {
    const maps = await Promise.all(STATE_MAPS.map((s) => loadStateMap(s.id)));
    let seats = 0;
    for (const map of maps) {
      expect(map.regions.length).toBe(STATE_MAPS.find((s) => s.id === map.id)!.regions);
      expect(new Set(map.regions.map((r) => r.id)).size).toBe(map.regions.length);
      expect(map.viewBox.width).toBe(800);
      for (const region of map.regions) {
        expect(region.path.startsWith('M')).toBe(true);
        expect(region.labelX).toBeGreaterThan(0);
        expect(region.labelX).toBeLessThan(map.viewBox.width);
        if (region.capital) {
          seats++;
          const { x, y } = projectPoint(map.projection, region.capital.lat, region.capital.lng);
          expect(pathContains(region.path, x, y), `${map.name}/${region.name}`).toBe(true);
        }
      }
      if (map.id === 'VE-W' || map.id === 'VE-GE') {
        expect(map.capital).toBeUndefined();
      } else {
        expect(map.capital, map.name).toBeDefined();
        const { x, y } = projectPoint(map.projection, map.capital!.lat, map.capital!.lng);
        expect(
          map.regions.some((r) => pathContains(r.path, x, y)),
          `${map.name} capital ${map.capital!.name}`,
        ).toBe(true);
      }
    }
    expect(seats).toBe(332); // 335 municipalities; 3 seats without a reliable position
  });
});
