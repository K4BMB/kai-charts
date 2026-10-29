import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartPointEvent, ChartSeries } from '../core/types';
import { KcBarChart } from './bar-chart';

const CATEGORIES = ['Nacimiento', 'Matrimonio', 'Defunción'];
const SERIES: ChartSeries[] = [
  { name: 'Registrados', data: [10000, 20000, 30000] },
  { name: 'Sincronizados', data: [5000, 15000, 25000] },
];

describe('KcBarChart', () => {
  let fixture: ComponentFixture<KcBarChart>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcBarChart] }).compileComponents();
    fixture = TestBed.createComponent(KcBarChart);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.componentRef.setInput('series', SERIES);
  });

  const bars = () => Array.from(element.querySelectorAll<SVGRectElement>('rect.kc-bar'));
  const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

  it('renders one bar per category and series', () => {
    fixture.detectChanges();
    expect(bars()).toHaveLength(6);
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('group');
  });

  it('scales vertical bars by value and keeps a fixed height', () => {
    fixture.componentRef.setInput('height', 320);
    fixture.detectChanges();
    const [small, , big] = bars().filter((b) => b.dataset['series'] === '0');
    expect(num(big, 'height') / num(small, 'height')).toBeCloseTo(3, 3);
    expect(element.querySelector('svg')?.getAttribute('height')).toBe('320');
  });

  it('uses widths when horizontal', () => {
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    const [small, , big] = bars().filter((b) => b.dataset['series'] === '0');
    expect(num(small, 'height')).toBe(num(big, 'height'));
    expect(num(big, 'width') / num(small, 'width')).toBeCloseTo(3, 3);
  });

  it('stacks series when stacked is set', () => {
    fixture.componentRef.setInput('stacked', true);
    fixture.detectChanges();
    const [first, second] = bars().filter((b) => b.dataset['category'] === '0');
    expect(num(first, 'x')).toBe(num(second, 'x'));
    expect(num(second, 'y') + num(second, 'height')).toBeCloseTo(num(first, 'y'), 1);
  });

  it('formats axis ticks with es-VE by default', () => {
    fixture.detectChanges();
    const ticks = Array.from(element.querySelectorAll('text.kc-tick')).map((t) =>
      t.textContent?.trim(),
    );
    expect(ticks).toContain('10.000');
  });

  it('accepts Intl options and custom formatters', () => {
    fixture.componentRef.setInput('valueFormat', (v: number) => `${v / 1000}k`);
    fixture.componentRef.setInput('showValues', true);
    fixture.detectChanges();
    const values = Array.from(element.querySelectorAll('text.kc-value')).map((t) =>
      t.textContent?.trim(),
    );
    expect(values).toContain('30k');
  });

  it('shows the empty state when every value is null', () => {
    fixture.componentRef.setInput('series', [{ name: 'Nada', data: [null, null, null] }]);
    fixture.detectChanges();
    expect(bars()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
  });

  it('treats zeros as data and keeps the real axis', () => {
    fixture.componentRef.setInput('series', [{ name: 'Trámites', data: [0, 0, 0] }]);
    fixture.detectChanges();
    expect(element.querySelector('.kc-state--empty')).toBeNull();
    expect(element.querySelectorAll('text.kc-tick')).toHaveLength(2 + CATEGORIES.length);
  });

  it('shows the loading skeleton instead of the chart', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
  });

  it('renders the mirror table on demand', () => {
    fixture.componentRef.setInput('showTable', true);
    fixture.componentRef.setInput('label', 'Trámites');
    fixture.detectChanges();
    expect(element.querySelector('caption')?.textContent?.trim()).toBe('Trámites');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.querySelector('tbody td')?.textContent?.trim()).toBe('10.000');
  });

  it('shows the legend only for several series by default and toggles them', () => {
    fixture.detectChanges();
    const buttons = element.querySelectorAll<HTMLButtonElement>('.kc-legend__item');
    expect(buttons).toHaveLength(2);
    buttons[1].click();
    fixture.detectChanges();
    expect(bars()).toHaveLength(3);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('series', [SERIES[0]]);
    fixture.detectChanges();
    expect(element.querySelector('kc-legend')).toBeNull();
  });

  it('emits barClick with the data point on click and keyboard', () => {
    fixture.detectChanges();
    const events: ChartPointEvent[] = [];
    fixture.componentInstance.barClick.subscribe((e) => events.push(e));
    const bar = bars()[1];
    bar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      seriesIndex: 1,
      categoryIndex: 0,
      series: 'Sincronizados',
      category: 'Nacimiento',
      value: 5000,
    });
  });

  it('opens an accessible tooltip on focus and closes it on blur', () => {
    fixture.detectChanges();
    const bar = bars()[0];
    expect(bar.getAttribute('aria-label')).toBe('Nacimiento, Registrados: 10.000');
    bar.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.textContent).toContain('Nacimiento');
    expect(tooltip?.querySelectorAll('.kc-tooltip__row')).toHaveLength(2);
    bar.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });
});
