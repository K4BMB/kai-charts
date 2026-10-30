import { fireEvent, render } from '@testing-library/react';
import type { MapDatum, MapMarker } from 'kai-charts-core';
import { VenezuelaMap, type MapRegionClickEvent, type VenezuelaMapProps } from './venezuela-map';

const DATA: MapDatum[] = [
  { id: 'VE-V', value: 5260 },
  { id: 'VE-M', value: 4940 },
  { id: 'Lara', value: 3390 },
];

const MARKERS: MapMarker[] = [
  { id: 'UM-ZUL-02', lat: 10.6427, lng: -71.6125, label: 'UM-ZUL-02 · Maracaibo', value: 14 },
  { id: 'UM-LAR-04', lat: 10.0678, lng: -69.3467, label: 'UM-LAR-04 · Barquisimeto', value: 11 },
];

describe('VenezuelaMap', () => {
  let element: HTMLElement;

  function mount(props: Partial<VenezuelaMapProps> = {}) {
    const result = render(<VenezuelaMap data={DATA} {...props} />);
    element = result.container;
    return result;
  }

  const regions = () => Array.from(element.querySelectorAll<SVGPathElement>('path.kc-map__region'));
  const region = (id: string) =>
    element.querySelector<SVGPathElement>(`path.kc-map__region[data-id="${id}"]`);
  const paths = () => Array.from(element.querySelectorAll<SVGPathElement>('svg path'));

  it('renders the 25 regions and the claim zone, which showClaimZone=false removes', () => {
    const { rerender } = mount({ label: 'Ciudadanos por estado' });
    expect(element.firstElementChild?.className).toBe('kc-chart kc-map');
    expect(regions()).toHaveLength(25);
    const claim = element.querySelector('path.kc-map__claim');
    expect(claim).not.toBeNull();
    expect(paths()[0]).toBe(claim);
    const svg = element.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 800 614');
    expect(svg?.getAttribute('role')).toBe('group');
    expect(svg?.getAttribute('aria-label')).toBe('Ciudadanos por estado');
    expect(svg?.hasAttribute('height')).toBe(false);
    // The hatch pattern is referenced by the claim path through a per-instance id.
    const pattern = element.querySelector('pattern');
    expect(pattern?.querySelector('.kc-map__hatch-line')).not.toBeNull();
    expect(claim?.getAttribute('fill')).toBe(`url(#${pattern?.id})`);

    rerender(<VenezuelaMap data={DATA} showClaimZone={false} />);
    expect(element.querySelector('path.kc-map__claim')).toBeNull();
    expect(regions()).toHaveLength(25);
  });

  it('paints regions with data by opacity and leaves the others grey', () => {
    mount();
    const lara = region('VE-K');
    expect(lara?.classList.contains('kc-map__region--empty')).toBe(false);
    expect(lara?.getAttribute('style')).toContain('fill');
    expect(Number(lara?.getAttribute('fill-opacity'))).toBeGreaterThan(0.17);
    expect(region('VE-V')?.getAttribute('fill-opacity')).toBe('1');
    expect(region('VE-V')?.getAttribute('aria-label')).toBe('Zulia: 5.260');

    const falcon = region('VE-I');
    expect(falcon?.classList.contains('kc-map__region--empty')).toBe(true);
    expect(falcon?.hasAttribute('style')).toBe(false);
    expect(falcon?.hasAttribute('fill-opacity')).toBe(false);
    expect(falcon?.getAttribute('aria-label')).toBe('Falcón: Sin datos');
    expect(regions().filter((r) => r.classList.contains('kc-map__region--empty'))).toHaveLength(22);
    // Draw order: without data first, with data after them.
    const classes = regions().map((r) => r.classList.contains('kc-map__region--empty'));
    expect(classes.slice(0, 22).every(Boolean)).toBe(true);
    expect(classes.slice(22).some(Boolean)).toBe(false);
    expect(element.querySelector('.kc-map')?.getAttribute('style')).toContain('--kc-map-min: 18%');
  });

  it('outlines highlighted regions and draws them last', () => {
    mount({ highlight: 'Zulia' });
    const zulia = region('VE-V');
    expect(zulia?.classList.contains('kc-map__region--highlighted')).toBe(true);
    expect(paths().at(-1)).toBe(zulia);
    expect(element.querySelectorAll('.kc-map__region--highlighted')).toHaveLength(1);
  });

  it('opens the tooltip on focus with the name and the value, closes it on blur', () => {
    mount({ valueHeader: 'Ciudadanos' });
    const zulia = region('VE-V') as SVGPathElement;
    fireEvent.focus(zulia);
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.querySelector('.kc-tooltip__title')?.textContent).toBe('Zulia');
    // Value row + capital row (capitals are on by default).
    expect(tooltip?.querySelectorAll('.kc-tooltip__row')).toHaveLength(2);
    expect(tooltip?.querySelector('.kc-tooltip__name')?.textContent).toBe('Ciudadanos');
    expect(tooltip?.querySelector('.kc-tooltip__value')?.textContent).toBe('5.260');
    // Zulia sits on the west edge: the bubble opens to the right so it stays inside the map.
    expect(tooltip?.classList.contains('kc-tooltip--right')).toBe(true);
    fireEvent.blur(zulia);
    expect(element.querySelector('.kc-tooltip')).toBeNull();

    fireEvent.focus(region('VE-I') as SVGPathElement);
    expect(element.querySelector('.kc-tooltip__value')?.textContent).toBe('Sin datos');
  });

  it('draws a capital dot in every state and names it in the tooltip; showCapitals=false removes both', () => {
    mount();
    expect(element.querySelectorAll('circle.kc-map__capital')).toHaveLength(24);
    fireEvent.focus(region('VE-V') as SVGPathElement);
    const names = Array.from(element.querySelectorAll('.kc-tooltip__name')).map(
      (n) => n.textContent,
    );
    const values = Array.from(element.querySelectorAll('.kc-tooltip__value')).map(
      (n) => n.textContent,
    );
    expect(names).toEqual(['Valor', 'Capital']);
    expect(values).toEqual(['5.260', 'Maracaibo']);
    // The capital row carries no swatch.
    expect(element.querySelectorAll('.kc-tooltip__swatch')).toHaveLength(1);

    mount({ showCapitals: false });
    expect(element.querySelectorAll('circle.kc-map__capital')).toHaveLength(0);
    fireEvent.focus(region('VE-V') as SVGPathElement);
    expect(element.querySelectorAll('.kc-tooltip__row')).toHaveLength(1);
  });

  it('emits onRegionClick on click and Enter, and marks regions clickable only then', () => {
    const events: MapRegionClickEvent[] = [];
    const { rerender } = mount({ onRegionClick: (e) => events.push(e) });
    const zulia = region('VE-V') as SVGPathElement;
    expect(zulia.classList.contains('kc-map__region--clickable')).toBe(true);
    expect(zulia.getAttribute('tabindex')).toBe('0');
    fireEvent.click(zulia);
    fireEvent.keyDown(zulia, { key: 'Enter' });
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ id: 'VE-V', name: 'Zulia', value: 5260 });
    fireEvent.keyDown(region('VE-I') as SVGPathElement, { key: ' ' });
    expect(events[2]).toEqual({ id: 'VE-I', name: 'Falcón', value: null });

    rerender(<VenezuelaMap data={DATA} />);
    expect(element.querySelector('.kc-map__region--clickable')).toBeNull();
    expect(region('VE-V')?.getAttribute('tabindex')).toBe('0');
  });

  it('renders one marker per entry and emits the original marker on click', () => {
    const clicked: MapMarker[] = [];
    mount({ markers: MARKERS, onMarkerClick: (m) => clicked.push(m) });
    const markers = Array.from(element.querySelectorAll<SVGGElement>('g.kc-map__marker'));
    expect(markers).toHaveLength(2);
    expect(markers[0].getAttribute('aria-label')).toBe('UM-ZUL-02 · Maracaibo: 14');
    expect(markers[0].getAttribute('transform')).toMatch(/^translate\(\d+(\.\d+)? \d+(\.\d+)?\)$/);
    expect(markers[0].querySelector('.kc-map__marker-halo')?.getAttribute('r')).toBe('9');
    expect(markers[0].querySelector('.kc-map__marker-dot')?.getAttribute('r')).toBe('4.5');
    expect(markers[0].classList.contains('kc-map__marker--clickable')).toBe(true);
    fireEvent.click(markers[1]);
    fireEvent.keyDown(markers[0], { key: 'Enter' });
    expect(clicked).toEqual([MARKERS[1], MARKERS[0]]);

    fireEvent.focus(markers[0]);
    expect(element.querySelector('.kc-tooltip__title')?.textContent).toBe('UM-ZUL-02 · Maracaibo');
    expect(element.querySelector('.kc-tooltip__value')?.textContent).toBe('14');
  });

  it('shows the legend with min, max and filled/total only when there is data', () => {
    const { rerender } = mount();
    const legend = element.querySelector('.kc-map__legend');
    expect(legend?.querySelector('.kc-map__legend-min')?.textContent).toBe('3.390');
    expect(legend?.querySelector('.kc-map__legend-max')?.textContent).toBe('5.260');
    expect(legend?.querySelector('.kc-map__legend-empty')?.textContent).toBe('Sin datos · 3/25');
    expect(legend?.querySelector('.kc-map__legend-swatch')).not.toBeNull();

    rerender(<VenezuelaMap data={[]} />);
    expect(element.querySelector('.kc-map__legend')).toBeNull();
    expect(regions()).toHaveLength(25);
    expect(element.querySelector('.kc-state--empty')).toBeNull();

    rerender(<VenezuelaMap data={DATA} showLegend={false} />);
    expect(element.querySelector('.kc-map__legend')).toBeNull();
  });

  it('renders labels and the mirror table on demand', () => {
    mount({ showLabels: true, showTable: true, label: 'Ciudadanos', valueHeader: 'Ciudadanos' });
    expect(element.querySelectorAll('text.kc-map__label')).toHaveLength(25);
    expect(element.querySelector('text.kc-map__claim-label')?.textContent).toBe(
      'Zona en Reclamación',
    );
    expect(element.querySelector('caption')?.textContent).toBe('Ciudadanos');
    expect(element.querySelectorAll('thead th')[1].textContent).toBe('Ciudadanos');
    const rows = Array.from(element.querySelectorAll('tbody tr'));
    expect(rows).toHaveLength(25);
    const cells = rows.map((r) => r.querySelector('td')?.textContent);
    expect(cells).toContain('5.260');
    expect(cells.filter((c) => c === 'Sin datos')).toHaveLength(22);
  });

  it('shows the loading skeleton instead of the svg', () => {
    mount({ loading: true });
    const skeleton = element.querySelector('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect((skeleton as HTMLElement).style.height).toBe('461px');
    expect(element.querySelector('svg')).toBeNull();
  });

  it('uses a different pattern id per instance', () => {
    const { container } = render(
      <>
        <VenezuelaMap data={DATA} />
        <VenezuelaMap data={DATA} />
      </>,
    );
    const ids = Array.from(container.querySelectorAll('pattern')).map((p) => p.id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids.every((id) => /^kc-map-hatch-[\w-]+$/.test(id))).toBe(true);
  });
});
