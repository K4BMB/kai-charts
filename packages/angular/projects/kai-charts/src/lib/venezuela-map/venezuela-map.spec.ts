import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapDatum, MapMarker } from 'kai-charts-core';
import { KcVenezuelaMap, MapRegionClickEvent } from './venezuela-map';

const DATA: MapDatum[] = [
  { id: 'VE-V', value: 5260 },
  { id: 'VE-M', value: 4940 },
  { id: 'VE-A', value: 3830 },
];

const MARKERS: MapMarker[] = [
  { id: 'UM-ZUL-02', lat: 10.6427, lng: -71.6125, label: 'UM-ZUL-02 · Maracaibo', value: 14 },
  { id: 'UM-LAR-04', lat: 10.0678, lng: -69.3467, label: 'UM-LAR-04 · Barquisimeto', value: 11 },
];

describe('KcVenezuelaMap', () => {
  let fixture: ComponentFixture<KcVenezuelaMap>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcVenezuelaMap] }).compileComponents();
    fixture = TestBed.createComponent(KcVenezuelaMap);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('data', DATA);
  });

  const regions = () => Array.from(element.querySelectorAll<SVGPathElement>('path.kc-map__region'));
  const region = (id: string) => element.querySelector<SVGPathElement>(`path[data-id="${id}"]`)!;
  const text = (selector: string) => element.querySelector(selector)?.textContent?.trim();

  it('renders the 25 regions and the hatched claim zone with a per-instance pattern', () => {
    fixture.detectChanges();
    expect(regions()).toHaveLength(25);
    expect(element.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 800 614');
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('group');
    expect(element.querySelector('svg')?.hasAttribute('height')).toBe(false);
    const claim = element.querySelector('path.kc-map__claim');
    const pattern = element.querySelector('pattern');
    expect(claim?.getAttribute('fill')).toBe(`url(#${pattern?.id})`);
    expect(pattern?.querySelector('.kc-map__hatch-line')).not.toBeNull();

    const other = TestBed.createComponent(KcVenezuelaMap);
    other.detectChanges();
    expect(other.nativeElement.querySelector('pattern').id).not.toBe(pattern?.id);

    fixture.componentRef.setInput('showClaimZone', false);
    fixture.detectChanges();
    expect(element.querySelector('path.kc-map__claim')).toBeNull();
    expect(regions()).toHaveLength(25);
  });

  it('paints only the regions with data, scaling the opacity up to 1', () => {
    fixture.componentRef.setInput('color', '#b45309');
    fixture.detectChanges();
    const lara = region('VE-K');
    expect(lara.classList.contains('kc-map__region--empty')).toBe(true);
    expect(lara.hasAttribute('fill-opacity')).toBe(false);
    expect(lara.getAttribute('style')).toBeNull();
    expect(lara.getAttribute('aria-label')).toBe('Lara: Sin datos');

    const zulia = region('VE-V');
    expect(zulia.classList.contains('kc-map__region--empty')).toBe(false);
    expect(zulia.getAttribute('fill-opacity')).toBe('1');
    expect(zulia.getAttribute('style')).toMatch(/fill: (#b45309|rgb\(180, 83, 9\))/);
    expect(zulia.getAttribute('aria-label')).toBe('Zulia: 5.260');
    expect(Number(region('VE-A').getAttribute('fill-opacity'))).toBeCloseTo(0.18, 2);
    expect(element.style.getPropertyValue('--kc-map-fill')).toBe('#b45309');
    expect(element.style.getPropertyValue('--kc-map-min')).toBe('18%');
  });

  it('outlines the highlighted region and draws it last', () => {
    fixture.componentRef.setInput('highlight', 'Zulia');
    fixture.detectChanges();
    const paths = Array.from(element.querySelectorAll('path'));
    const last = paths[paths.length - 1];
    expect(last.getAttribute('data-id')).toBe('VE-V');
    expect(last.classList.contains('kc-map__region--highlighted')).toBe(true);
    expect(element.querySelectorAll('.kc-map__region--highlighted')).toHaveLength(1);
  });

  it('opens the tooltip on focus with the name and formatted value and closes it on blur', () => {
    fixture.componentRef.setInput('valueHeader', 'Ciudadanos');
    fixture.detectChanges();
    const zulia = region('VE-V');
    zulia.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(text('.kc-tooltip__title')).toBe('Zulia');
    expect(text('.kc-tooltip__name')).toBe('Ciudadanos');
    expect(text('.kc-tooltip__value')).toBe('5.260');
    // Zulia sits on the west edge: the bubble opens to the right so it stays inside the map.
    expect(tooltip?.classList.contains('kc-tooltip--right')).toBe(true);
    zulia.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('draws a capital dot in every state and names it in the tooltip; showCapitals=false removes both', () => {
    fixture.detectChanges();
    expect(element.querySelectorAll('circle.kc-map__capital')).toHaveLength(24);
    region('VE-V').dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const names = Array.from(element.querySelectorAll('.kc-tooltip__name')).map((n) =>
      n.textContent?.trim(),
    );
    const values = Array.from(element.querySelectorAll('.kc-tooltip__value')).map((n) =>
      n.textContent?.trim(),
    );
    expect(names).toEqual(['Valor', 'Capital']);
    expect(values).toEqual(['5.260', 'Maracaibo']);

    fixture.componentRef.setInput('showCapitals', false);
    fixture.detectChanges();
    expect(element.querySelectorAll('circle.kc-map__capital')).toHaveLength(0);
    region('VE-V').dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(element.querySelectorAll('.kc-tooltip__name')).toHaveLength(1);
  });

  it('emits regionClick on click and keyboard', () => {
    fixture.detectChanges();
    const events: MapRegionClickEvent[] = [];
    fixture.componentInstance.regionClick.subscribe((e) => events.push(e));
    const zulia = region('VE-V');
    expect(zulia.getAttribute('tabindex')).toBe('0');
    zulia.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    zulia.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    region('VE-K').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).toEqual([
      { id: 'VE-V', name: 'Zulia', value: 5260 },
      { id: 'VE-V', name: 'Zulia', value: 5260 },
      { id: 'VE-K', name: 'Lara', value: null },
    ]);
  });

  it('renders one marker per entry and emits markerClick with the original marker', () => {
    fixture.componentRef.setInput('markers', MARKERS);
    fixture.detectChanges();
    const markers = Array.from(element.querySelectorAll<SVGGElement>('g.kc-map__marker'));
    expect(markers).toHaveLength(2);
    expect(markers[0].getAttribute('aria-label')).toBe('UM-ZUL-02 · Maracaibo: 14');
    expect(markers[0].getAttribute('transform')).toMatch(/^translate\(\d+(\.\d+)? \d+(\.\d+)?\)$/);
    expect(markers[0].querySelector('.kc-map__marker-halo')?.getAttribute('r')).toBe('9');
    expect(markers[0].querySelector('.kc-map__marker-dot')?.getAttribute('r')).toBe('4.5');

    const events: MapMarker[] = [];
    fixture.componentInstance.markerClick.subscribe((e) => events.push(e));
    markers[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(events).toHaveLength(1);
    expect(events[0]).toBe(MARKERS[1]);
  });

  it('shows the legend only when there is data and it is enabled', () => {
    fixture.detectChanges();
    expect(text('.kc-map__legend-min')).toBe('3.830');
    expect(text('.kc-map__legend-max')).toBe('5.260');
    expect(text('.kc-map__legend-empty')).toBe('Sin datos · 3/25');

    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(element.querySelector('.kc-map__legend')).toBeNull();
    expect(regions()).toHaveLength(25);

    fixture.componentRef.setInput('data', DATA);
    fixture.componentRef.setInput('showLegend', false);
    fixture.detectChanges();
    expect(element.querySelector('.kc-map__legend')).toBeNull();
  });

  it('renders the labels and the mirror table on demand', () => {
    fixture.componentRef.setInput('showLabels', true);
    fixture.componentRef.setInput('showTable', true);
    fixture.componentRef.setInput('label', 'Ciudadanos por estado');
    fixture.componentRef.setInput('valueHeader', 'Ciudadanos');
    fixture.detectChanges();
    expect(element.querySelectorAll('text.kc-map__label')).toHaveLength(25);
    expect(text('text.kc-map__claim-label')).toBe('Zona en Reclamación');
    expect(element.querySelector('caption')?.textContent?.trim()).toBe('Ciudadanos por estado');
    expect(element.querySelectorAll('thead th')[1].textContent?.trim()).toBe('Ciudadanos');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(25);
  });

  it('shows the loading skeleton instead of the map', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const skeleton = element.querySelector<HTMLElement>('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.style.height).toBe('461px');
    expect(element.querySelector('svg')).toBeNull();
  });
});
