import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapDatum, RegionMapGeometry, loadStateMap } from 'kai-charts-core';
import { KcStateMap } from './state-map';
import { KcVenezuelaMap, MapRegionClickEvent } from '../venezuela-map/venezuela-map';

const DATA: MapDatum[] = [
  { id: 'Maracaibo', value: 5260 },
  { id: '2302', value: 900 }, // INE code of Baralt
];

/** Waits (polling) until the pending `loadStateMap` chunk has rendered or the empty state shows. */
async function settle(fixture: ComponentFixture<unknown>, element: HTMLElement): Promise<void> {
  for (let i = 0; i < 200; i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();
    if (!element.querySelector('[aria-busy="true"]')) return;
  }
  throw new Error('the state map did not settle');
}

describe('KcStateMap', () => {
  let zulia: RegionMapGeometry;
  let esequiba: RegionMapGeometry;
  let fixture: ComponentFixture<KcStateMap>;
  let element: HTMLElement;

  beforeAll(async () => {
    zulia = await loadStateMap('Zulia');
    esequiba = await loadStateMap('VE-GE');
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcStateMap] }).compileComponents();
    fixture = TestBed.createComponent(KcStateMap);
    element = fixture.nativeElement as HTMLElement;
  });

  const regions = () => Array.from(element.querySelectorAll<SVGPathElement>('path.kc-map__region'));
  const region = (id: string) => element.querySelector<SVGPathElement>(`path[data-id="${id}"]`)!;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.trim();
  const tooltipRows = () =>
    Array.from(element.querySelectorAll('.kc-tooltip__row')).map((row) => [
      row.querySelector('.kc-tooltip__name')?.textContent?.trim(),
      row.querySelector('.kc-tooltip__value')?.textContent?.trim(),
    ]);

  it('renders a preloaded geometry synchronously: 21 municipalities with slug ids, own viewBox', () => {
    fixture.componentRef.setInput('geometry', zulia);
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
    expect(element.classList.contains('kc-map')).toBe(true);
    expect(regions()).toHaveLength(21);
    expect(region('maracaibo')).not.toBeNull();
    expect(region('jesus-enrique-lossada')).not.toBeNull();
    expect(element.querySelector('svg')?.getAttribute('viewBox')).toBe(
      `0 0 800 ${zulia.viewBox.height}`,
    );
  });

  it('loads the state by name: skeleton first, the regions once the chunk arrives, again on change', async () => {
    fixture.componentRef.setInput('state', 'Zulia');
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
    await settle(fixture, element);
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
    expect(regions()).toHaveLength(21);

    fixture.componentRef.setInput('state', 'Falcón');
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    await settle(fixture, element);
    expect(regions()).toHaveLength(25);
  });

  it('joins data by name and INE code and shows the legend as filled/total', () => {
    fixture.componentRef.setInput('geometry', zulia);
    fixture.componentRef.setInput('data', DATA);
    fixture.detectChanges();
    expect(region('maracaibo').getAttribute('fill-opacity')).toBe('1');
    expect(region('baralt').classList.contains('kc-map__region--empty')).toBe(false);
    expect(region('cabimas').classList.contains('kc-map__region--empty')).toBe(true);
    expect(text('.kc-map__legend-empty')).toBe('Sin datos · 2/21');
  });

  it('draws only the state capital by default; showSeats adds the seats; showCapitals removes the capital', () => {
    fixture.componentRef.setInput('geometry', zulia);
    fixture.detectChanges();
    const capitals = () => element.querySelectorAll('circle.kc-map__capital');
    expect(capitals()).toHaveLength(1);
    expect(capitals()[0].classList.contains('kc-map__capital--state')).toBe(true);
    expect(capitals()[0].getAttribute('r')).toBe('3');

    fixture.componentRef.setInput('showSeats', true);
    fixture.detectChanges();
    expect(capitals()).toHaveLength(22);
    // The state capital comes after the seats so no seat paints over it.
    expect(capitals()[21].classList.contains('kc-map__capital--state')).toBe(true);

    fixture.componentRef.setInput('showCapitals', false);
    fixture.detectChanges();
    expect(capitals()).toHaveLength(21);
    expect(element.querySelector('.kc-map__capital--state')).toBeNull();
  });

  it('opens a tooltip with the value and the seat, never a municipalities row', () => {
    fixture.componentRef.setInput('geometry', zulia);
    fixture.componentRef.setInput('data', DATA);
    fixture.componentRef.setInput('valueHeader', 'Ciudadanos');
    fixture.componentRef.setInput('showCapitals', false);
    fixture.detectChanges();
    region('maracaibo').dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(text('.kc-tooltip__title')).toBe('Maracaibo');
    expect(tooltipRows()).toEqual([
      ['Ciudadanos', '5.260'],
      ['Capital', 'Maracaibo'],
    ]);
    region('maracaibo').dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('emits regionClick with the INE code on click and Enter', () => {
    fixture.componentRef.setInput('geometry', zulia);
    fixture.componentRef.setInput('data', DATA);
    fixture.detectChanges();
    const events: MapRegionClickEvent[] = [];
    fixture.componentInstance.regionClick.subscribe((e) => events.push(e));
    region('maracaibo').dispatchEvent(new MouseEvent('click'));
    region('maracaibo').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const code = zulia.regions.find((r) => r.id === 'maracaibo')!.code;
    expect(events).toEqual([
      { id: 'maracaibo', name: 'Maracaibo', value: 5260, code },
      { id: 'maracaibo', name: 'Maracaibo', value: 5260, code },
    ]);
  });

  it('shows the empty state for an unknown state', async () => {
    fixture.componentRef.setInput('state', 'Narnia');
    fixture.detectChanges();
    await settle(fixture, element);
    expect(element.querySelector('svg')).toBeNull();
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
    expect(text('.kc-state--empty')).toBe('Estado no disponible');

    fixture.componentRef.setInput('unknownStateText', 'Sin mapa');
    fixture.detectChanges();
    expect(text('.kc-state--empty')).toBe('Sin mapa');
  });

  it('renders the mirror table with the region header and the label as caption', () => {
    fixture.componentRef.setInput('geometry', zulia);
    fixture.componentRef.setInput('data', DATA);
    fixture.componentRef.setInput('showTable', true);
    fixture.componentRef.setInput('label', 'Ciudadanos por municipio');
    fixture.componentRef.setInput('valueHeader', 'Ciudadanos');
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(21);
    const headers = Array.from(element.querySelectorAll('thead th')).map((th) =>
      th.textContent?.trim(),
    );
    expect(headers).toEqual(['Municipio', 'Ciudadanos']);
    expect(text('caption')).toBe('Ciudadanos por municipio');

    fixture.componentRef.setInput('regionHeader', 'Mun.');
    fixture.detectChanges();
    expect(element.querySelector('thead th')?.textContent?.trim()).toBe('Mun.');
  });

  it('renders Guayana Esequiba as a single region without a capital dot', () => {
    fixture.componentRef.setInput('geometry', esequiba);
    fixture.detectChanges();
    expect(regions()).toHaveLength(1);
    expect(region('guayana-esequiba')).not.toBeNull();
    expect(element.querySelector('.kc-map__capital--state')).toBeNull();
    expect(element.querySelector('.kc-map__legend')).toBeNull();
  });

  it('leaves the national map untouched: no map-level capital dot there', () => {
    const national = TestBed.createComponent(KcVenezuelaMap);
    national.detectChanges();
    const host = national.nativeElement as HTMLElement;
    expect(host.querySelectorAll('path.kc-map__region')).toHaveLength(26);
    expect(host.querySelectorAll('circle.kc-map__capital')).toHaveLength(24);
    expect(host.querySelector('.kc-map__capital--state')).toBeNull();
  });
});
