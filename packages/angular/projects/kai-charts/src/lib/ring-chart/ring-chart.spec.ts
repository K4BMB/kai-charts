import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RingItem } from 'kai-charts-core';
import { ItemClickEvent } from '../core/events';
import { KcRingChart } from './ring-chart';

const RINGS: RingItem[] = [
  { name: 'Saldo', value: 0.917 },
  { name: 'Emitidas', value: 0.942 },
  { name: 'Recibidas', value: 0.871 },
];

describe('KcRingChart', () => {
  let fixture: ComponentFixture<KcRingChart>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcRingChart] }).compileComponents();
    fixture = TestBed.createComponent(KcRingChart);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('items', RINGS);
  });

  const arcs = () => Array.from(element.querySelectorAll<SVGCircleElement>('circle.kc-ring__arc'));
  const tracks = () =>
    Array.from(element.querySelectorAll<SVGCircleElement>('circle.kc-ring__track'));
  const num = (el: Element, attr: string) => Number(el.getAttribute(attr));
  const dasharray = (el: Element) =>
    (el.getAttribute('stroke-dasharray') ?? '').split(' ').map(Number);
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector)).map((t) => t.textContent?.trim());

  it('draws one track and one arc per ring, the outer ring first', () => {
    fixture.componentRef.setInput('label', 'Atención nacional');
    fixture.detectChanges();
    expect(tracks()).toHaveLength(3);
    expect(arcs()).toHaveLength(3);
    expect(num(arcs()[0], 'r')).toBeGreaterThan(num(arcs()[1], 'r'));
    expect(num(arcs()[1], 'r')).toBeGreaterThan(num(arcs()[2], 'r'));
    expect(num(tracks()[0], 'r')).toBe(num(arcs()[0], 'r'));
    expect(arcs()[0].getAttribute('transform')).toBe('rotate(-90 100 100)');
    expect(arcs()[0].getAttribute('aria-label')).toBe('Saldo: 91,7%');
    const svg = element.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 200 200');
    expect(svg?.getAttribute('aria-label')).toBe('Atención nacional');
    expect(element.querySelector<HTMLElement>('.kc-ring__figure')?.style.maxWidth).toBe('200px');
  });

  it('sizes the dash to the filled share and caps it at a full circle', () => {
    fixture.detectChanges();
    const [dash, circumference] = dasharray(arcs()[0]);
    expect(circumference).toBeCloseTo(2 * Math.PI * num(arcs()[0], 'r'), 1);
    expect(dash).toBeCloseTo(circumference * 0.917, 1);

    fixture.componentRef.setInput('items', [{ name: 'Lleno', value: 1.2 }]);
    fixture.detectChanges();
    const [full, total] = dasharray(arcs()[0]);
    expect(full).toBe(total);
  });

  it('marks a zero ring as empty', () => {
    fixture.componentRef.setInput('items', [{ name: 'Nada', value: 0 }, RINGS[0]]);
    fixture.detectChanges();
    expect(arcs()[0].classList.contains('kc-ring__arc--empty')).toBe(true);
    expect(dasharray(arcs()[0])[0]).toBe(0);
    expect(arcs()[1].classList.contains('kc-ring__arc--empty')).toBe(false);
  });

  it('renders the center label, value and trend only when given', () => {
    fixture.detectChanges();
    expect(element.querySelector('.kc-ring__center')).toBeNull();

    fixture.componentRef.setInput('centerLabel', 'Saldo');
    fixture.componentRef.setInput('centerValue', 0.917);
    fixture.componentRef.setInput('centerTrend', 0.038);
    fixture.detectChanges();
    expect(texts('.kc-ring__center-label')).toEqual(['Saldo']);
    expect(texts('.kc-ring__center-value')).toEqual(['91,7%']);
    const chip = element.querySelector('.kc-ring__center .kc-trend.kc-trend--up.kc-tone--success');
    expect(chip?.textContent?.trim()).toBe('+3,8%');

    fixture.componentRef.setInput('centerValue', 'Bs. 12');
    fixture.componentRef.setInput('centerTrend', undefined);
    fixture.detectChanges();
    expect(texts('.kc-ring__center-value')).toEqual(['Bs. 12']);
    expect(element.querySelector('.kc-trend')).toBeNull();
  });

  it('lists every ring in the legend with its formatted value', () => {
    fixture.detectChanges();
    expect(texts('.kc-ring__legend-name')).toEqual(['Saldo', 'Emitidas', 'Recibidas']);
    expect(texts('.kc-ring__legend-value')).toEqual(['91,7%', '94,2%', '87,1%']);
    expect(element.querySelectorAll('.kc-ring__legend-swatch')).toHaveLength(3);

    fixture.componentRef.setInput('showLegend', false);
    fixture.detectChanges();
    expect(element.querySelector('.kc-ring__legend')).toBeNull();
  });

  it('emits ringClick with the original item and its index on click and keyboard', () => {
    fixture.detectChanges();
    const events: ItemClickEvent<RingItem>[] = [];
    fixture.componentInstance.ringClick.subscribe((e) => events.push(e));
    const arc = arcs()[1];
    expect(arc.getAttribute('tabindex')).toBe('0');
    arc.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    arc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ item: RINGS[1], index: 1 });
    expect(events[0].item).toBe(RINGS[1]);
  });

  it('opens the tooltip above the ring on focus and closes it on blur', () => {
    fixture.detectChanges();
    const arc = arcs()[0];
    arc.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const tooltip = element.querySelector<HTMLElement>('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.querySelector('.kc-tooltip__title')?.textContent?.trim()).toBe('Saldo');
    expect(texts('.kc-tooltip__value')).toEqual(['91,7%']);
    expect(tooltip?.style.left).toBe('100px');
    expect(parseFloat(tooltip?.style.top ?? '')).toBeCloseTo(100 - num(arc, 'r'), 1);
    arc.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });

  it('shows the empty and loading states instead of the rings', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(arcs()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');

    fixture.componentRef.setInput('items', RINGS);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const skeleton = element.querySelector<HTMLElement>('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.style.height).toBe('200px');
    expect(element.querySelector('svg')).toBeNull();
  });
});
