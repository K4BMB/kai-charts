import { fireEvent, render, waitFor } from '@testing-library/react';
import { loadStateMap, type MapDatum, type RegionMapGeometry } from 'kai-charts-core';
import { StateMap, type StateMapProps } from './state-map';
import { VenezuelaMap, type MapRegionClickEvent } from './venezuela-map';

const DATA: MapDatum[] = [
  { id: 'Maracaibo', value: 5260 },
  { id: '2302', value: 900 }, // INE code of Baralt
];

describe('StateMap', () => {
  let zulia: RegionMapGeometry;
  let esequiba: RegionMapGeometry;
  let element: HTMLElement;

  beforeAll(async () => {
    zulia = await loadStateMap('Zulia');
    esequiba = await loadStateMap('VE-GE');
  });

  function mount(props: Partial<StateMapProps> = {}) {
    const result = render(<StateMap geometry={zulia} data={DATA} {...props} />);
    element = result.container;
    return result;
  }

  const regions = () => Array.from(element.querySelectorAll<SVGPathElement>('path.kc-map__region'));
  const region = (id: string) => element.querySelector<SVGPathElement>(`path[data-id="${id}"]`)!;
  const capitals = () => element.querySelectorAll('circle.kc-map__capital');
  const tooltipRows = () =>
    Array.from(element.querySelectorAll('.kc-tooltip__row')).map((row) => [
      row.querySelector('.kc-tooltip__name')?.textContent,
      row.querySelector('.kc-tooltip__value')?.textContent,
    ]);

  it('renders a preloaded geometry synchronously: 21 municipalities with slug ids, own viewBox', () => {
    mount();
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
    expect(element.firstElementChild?.className).toBe('kc-chart kc-map');
    expect(regions()).toHaveLength(21);
    expect(region('maracaibo')).not.toBeNull();
    expect(region('jesus-enrique-lossada')).not.toBeNull();
    expect(element.querySelector('svg')?.getAttribute('viewBox')).toBe(
      `0 0 800 ${zulia.viewBox.height}`,
    );
  });

  it('loads the state by name: skeleton first, the regions once the chunk arrives, again on change', async () => {
    const { rerender, container } = render(<StateMap state="Zulia" />);
    element = container;
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
    await waitFor(() => expect(regions()).toHaveLength(21));
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();

    rerender(<StateMap state="Falcón" />);
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    await waitFor(() => expect(regions()).toHaveLength(25));
  });

  it('joins data by name and INE code and shows the legend as filled/total', () => {
    mount();
    expect(region('maracaibo').getAttribute('fill-opacity')).toBe('1');
    expect(region('baralt').classList.contains('kc-map__region--empty')).toBe(false);
    expect(region('cabimas').classList.contains('kc-map__region--empty')).toBe(true);
    expect(element.querySelector('.kc-map__legend-empty')?.textContent).toBe('Sin datos · 2/21');
  });

  it('draws only the state capital by default; showSeats adds the seats; showCapitals removes the capital', () => {
    mount();
    expect(capitals()).toHaveLength(1);
    expect(capitals()[0].classList.contains('kc-map__capital--state')).toBe(true);
    expect(capitals()[0].getAttribute('r')).toBe('3');

    mount({ showSeats: true });
    expect(capitals()).toHaveLength(22);
    // The state capital comes after the seats so no seat paints over it.
    expect(capitals()[21].classList.contains('kc-map__capital--state')).toBe(true);

    mount({ showSeats: true, showCapitals: false });
    expect(capitals()).toHaveLength(21);
    expect(element.querySelector('.kc-map__capital--state')).toBeNull();
  });

  it('opens a tooltip with the value and the seat, never a municipalities row', () => {
    mount({ valueHeader: 'Ciudadanos', showCapitals: false });
    fireEvent.focus(region('maracaibo'));
    expect(element.querySelector('.kc-tooltip__title')?.textContent).toBe('Maracaibo');
    expect(tooltipRows()).toEqual([
      ['Ciudadanos', '5.260'],
      ['Capital', 'Maracaibo'],
    ]);
    fireEvent.blur(region('maracaibo'));
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('emits onRegionClick with the INE code on click and Enter', () => {
    const events: MapRegionClickEvent[] = [];
    mount({ onRegionClick: (e) => events.push(e) });
    fireEvent.click(region('maracaibo'));
    fireEvent.keyDown(region('maracaibo'), { key: 'Enter' });
    const code = zulia.regions.find((r) => r.id === 'maracaibo')!.code;
    expect(events).toEqual([
      { id: 'maracaibo', name: 'Maracaibo', value: 5260, code },
      { id: 'maracaibo', name: 'Maracaibo', value: 5260, code },
    ]);
  });

  it('shows the empty state for an unknown state', () => {
    const { rerender, container } = render(<StateMap state="Narnia" />);
    element = container;
    expect(element.querySelector('svg')).toBeNull();
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe(
      'Estado no disponible',
    );
    rerender(<StateMap state="Narnia" unknownStateText="Sin mapa" />);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin mapa');
  });

  it('renders the mirror table with the region header and the label as caption', () => {
    mount({ showTable: true, label: 'Ciudadanos por municipio', valueHeader: 'Ciudadanos' });
    expect(element.querySelectorAll('tbody tr')).toHaveLength(21);
    const headers = Array.from(element.querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers).toEqual(['Municipio', 'Ciudadanos']);
    expect(element.querySelector('caption')?.textContent).toBe('Ciudadanos por municipio');

    mount({ showTable: true, regionHeader: 'Mun.' });
    expect(element.querySelector('thead th')?.textContent).toBe('Mun.');
  });

  it('renders Guayana Esequiba as a single region without a capital dot', () => {
    mount({ geometry: esequiba, data: [] });
    expect(regions()).toHaveLength(1);
    expect(region('guayana-esequiba')).not.toBeNull();
    expect(element.querySelector('.kc-map__capital--state')).toBeNull();
    expect(element.querySelector('.kc-map__legend')).toBeNull();
  });

  it('leaves the national map untouched: no map-level capital dot there', () => {
    const { container } = render(<VenezuelaMap data={[{ id: 'VE-V', value: 1 }]} />);
    expect(container.querySelectorAll('path.kc-map__region')).toHaveLength(26);
    expect(container.querySelectorAll('circle.kc-map__capital')).toHaveLength(24);
    expect(container.querySelector('.kc-map__capital--state')).toBeNull();
  });
});
