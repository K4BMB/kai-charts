import { createValueFormatter } from './format.js';
import {
  VENEZUELA_CLAIM_ZONE,
  VENEZUELA_STATES,
  VENEZUELA_VIEWBOX,
  buildMapModel,
  normalizeRegionId,
  projectVenezuela,
  regionAnchor,
} from './venezuela-map.js';

const es = createValueFormatter('es-VE');

/** Bounding box of an SVG path made of absolute `M x y x y … Z` commands. */
function pathBounds(d: string) {
  const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const xs = numbers.filter((_, i) => i % 2 === 0);
  const ys = numbers.filter((_, i) => i % 2 === 1);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

describe('Venezuela geometry', () => {
  it('ships the 23 states, Distrito Capital and Dependencias Federales', () => {
    expect(VENEZUELA_STATES).toHaveLength(25);
    const ids = VENEZUELA_STATES.map((s) => s.id);
    expect(ids).toContain('VE-A');
    expect(ids).toContain('VE-Z');
    expect(ids).not.toContain('VE-Q');
    expect(VENEZUELA_STATES.find((s) => s.id === 'VE-X')?.name).toBe('La Guaira');
    expect(VENEZUELA_CLAIM_ZONE.name).toBe('Zona en Reclamación');
  });

  it('has valid paths inside the viewBox with label points inside each state box', () => {
    for (const state of VENEZUELA_STATES) {
      expect(state.path.startsWith('M')).toBe(true);
      const box = pathBounds(state.path);
      expect(box.minX).toBeGreaterThanOrEqual(0);
      expect(box.maxX).toBeLessThanOrEqual(VENEZUELA_VIEWBOX.width);
      expect(box.maxY).toBeLessThanOrEqual(VENEZUELA_VIEWBOX.height);
      expect(state.labelX).toBeGreaterThanOrEqual(box.minX);
      expect(state.labelX).toBeLessThanOrEqual(box.maxX);
    }
  });

  it('projects Caracas inside Distrito Capital and Maracaibo inside Zulia', () => {
    const caracas = projectVenezuela(10.4806, -66.9036);
    const capital = pathBounds(VENEZUELA_STATES.find((s) => s.id === 'VE-A')!.path);
    expect(caracas.x).toBeGreaterThan(capital.minX);
    expect(caracas.x).toBeLessThan(capital.maxX);
    expect(caracas.y).toBeGreaterThan(capital.minY);
    expect(caracas.y).toBeLessThan(capital.maxY);

    const maracaibo = projectVenezuela(10.6427, -71.6125);
    const zulia = pathBounds(VENEZUELA_STATES.find((s) => s.id === 'VE-V')!.path);
    expect(maracaibo.x).toBeGreaterThan(zulia.minX);
    expect(maracaibo.x).toBeLessThan(zulia.maxX);
  });
});

describe('normalizeRegionId', () => {
  it('accepts ISO codes in any case, names without accents and known aliases', () => {
    expect(normalizeRegionId('VE-V')).toBe('VE-V');
    expect(normalizeRegionId('ve-m')).toBe('VE-M');
    expect(normalizeRegionId('Zulia')).toBe('VE-V');
    expect(normalizeRegionId('merida')).toBe('VE-L');
    expect(normalizeRegionId('Dtto. Capital')).toBe('VE-A');
    expect(normalizeRegionId('Distrito Capital')).toBe('VE-A');
    expect(normalizeRegionId('Caracas')).toBe('VE-A');
    expect(normalizeRegionId('Vargas')).toBe('VE-X');
    expect(normalizeRegionId('La Guaira')).toBe('VE-X');
    expect(normalizeRegionId('Esequibo')).toBe('VE-ZR');
  });

  it('returns undefined for unknown input', () => {
    expect(normalizeRegionId('VE-Q')).toBeUndefined();
    expect(normalizeRegionId('Narnia')).toBeUndefined();
  });
});

describe('buildMapModel', () => {
  const data = [
    { id: 'Zulia', value: 5260 },
    { id: 'VE-M', value: 4940 },
    { id: 'Distrito Capital', value: 0 },
    { id: 'Lara', value: null },
    { id: 'Narnia', value: 10 },
  ];

  it('joins values to regions, scales opacity between min and max and reports unmatched ids', () => {
    const model = buildMapModel(data, [], es);
    const byId = Object.fromEntries(model.regions.map((r) => [r.id, r]));
    expect(model.total).toBe(25);
    expect(model.filled).toBe(3);
    expect(model.unmatched).toEqual(['Narnia']);
    expect(byId['VE-V']).toMatchObject({
      value: 5260,
      valueText: '5.260',
      opacity: 1,
      hasData: true,
    });
    expect(byId['VE-A']).toMatchObject({ value: 0, opacity: 0.18, hasData: true });
    expect(byId['VE-M'].opacity).toBeCloseTo(0.18 + (4940 / 5260) * 0.82, 2);
    expect(byId['VE-K']).toMatchObject({ value: null, hasData: false, opacity: 0, valueText: '—' });
    expect(byId['VE-K'].ariaLabel).toBe('Lara: —');
  });

  it('exposes a legend only when some region has data', () => {
    expect(buildMapModel(data, [], es).legend).toEqual({
      min: 0,
      max: 5260,
      minText: '0',
      maxText: '5.260',
      visible: true,
    });
    expect(buildMapModel([], [], es).legend.visible).toBe(false);
    expect(buildMapModel([], [], es).filled).toBe(0);
  });

  it('uses full opacity when every value is equal and honours highlight and emptyText', () => {
    const model = buildMapModel(
      [
        { id: 'VE-V', value: 7 },
        { id: 'VE-M', value: 7 },
      ],
      [],
      es,
      {
        highlight: ['zulia'],
        emptyText: 'Sin datos',
      },
    );
    const byId = Object.fromEntries(model.regions.map((r) => [r.id, r]));
    expect(byId['VE-V']).toMatchObject({ opacity: 1, highlighted: true });
    expect(byId['VE-M']).toMatchObject({ opacity: 1, highlighted: false });
    expect(byId['VE-K'].valueText).toBe('Sin datos');
  });

  it('projects markers and formats their values', () => {
    const model = buildMapModel(
      [],
      [{ id: 'um-1', lat: 10.4806, lng: -66.9036, label: 'UM-DC-04', value: 12 }],
      es,
    );
    expect(model.markers[0]).toMatchObject({
      label: 'UM-DC-04',
      valueText: '12',
      ariaLabel: 'UM-DC-04: 12',
    });
    expect(model.markers[0].x).toBeGreaterThan(0);
    expect(model.markers[0].color).toBe('var(--kc-color-1, #2563eb)');
  });

  it('scales a label point to the rendered width for tooltips', () => {
    const region = VENEZUELA_STATES[0];
    const anchor = regionAnchor(region, VENEZUELA_VIEWBOX.width / 2);
    expect(anchor.x).toBeCloseTo(region.labelX / 2, 1);
  });
});
