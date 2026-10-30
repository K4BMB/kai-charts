import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartPointEvent, ChartSeries } from 'kai-charts-core';
import { KcLineChart } from './line-chart';

const CATEGORIES = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
const SERIES: ChartSeries[] = [
  { name: 'Jornadas', data: [20, 22, 26, 24, 28, 31] },
  { name: 'Saldo', data: [48000, 45000, 43000, 40000, 38000, 36000] },
];

describe('KcLineChart', () => {
  let fixture: ComponentFixture<KcLineChart>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcLineChart] }).compileComponents();
    fixture = TestBed.createComponent(KcLineChart);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('categories', CATEGORIES);
    fixture.componentRef.setInput('series', SERIES);
  });

  const points = () => Array.from(element.querySelectorAll<SVGCircleElement>('circle.kc-point'));
  const lines = () => Array.from(element.querySelectorAll<SVGPathElement>('path.kc-line'));
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector)).map((t) => t.textContent?.trim());

  it('renders one point per finite value and one line per series', () => {
    fixture.detectChanges();
    expect(points()).toHaveLength(12);
    expect(lines()).toHaveLength(2);
    expect(lines()[1].getAttribute('data-series')).toBe('1');
    expect(points()[0].getAttribute('aria-label')).toBe('May, Jornadas: 20');
    expect(points()[0].getAttribute('r')).toBe('3');
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('group');
    expect(element.querySelector('path.kc-area')).toBeNull();
  });

  it('splits the line at null values', () => {
    fixture.componentRef.setInput('series', [
      { name: 'Con hueco', data: [10, 20, null, 30, 25, 35] },
    ]);
    fixture.detectChanges();
    expect(points()).toHaveLength(5);
    const d = lines()[0].getAttribute('d') ?? '';
    expect(d.match(/M/g)).toHaveLength(2);
  });

  it('draws the soft area under each line when area is set', () => {
    fixture.componentRef.setInput('area', true);
    fixture.detectChanges();
    const areas = Array.from(element.querySelectorAll<SVGPathElement>('path.kc-area'));
    expect(areas).toHaveLength(2);
    expect(areas[0].getAttribute('d')).toMatch(/Z$/);
    expect(areas[0].compareDocumentPosition(lines()[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('smooths the curve by default and draws straight segments with curve="linear"', () => {
    fixture.detectChanges();
    expect(lines()[0].getAttribute('d')).toContain('C');

    fixture.componentRef.setInput('curve', 'linear');
    fixture.detectChanges();
    const d = lines()[0].getAttribute('d') ?? '';
    expect(d).not.toContain('C');
    expect(d).toContain('L');
  });

  it('formats the ticks with es-VE and drops the value axis on demand', () => {
    fixture.detectChanges();
    expect(texts('text.kc-tick')).toContain('10.000');
    const plainX = Number(points()[0].getAttribute('cx'));

    fixture.componentRef.setInput('showValueAxis', false);
    fixture.detectChanges();
    expect(element.querySelectorAll('text.kc-tick')).toHaveLength(CATEGORIES.length);
    expect(texts('text.kc-tick title')).toEqual(CATEGORIES);
    expect(Number(points()[0].getAttribute('cx'))).toBeLessThan(plainX);
  });

  it('prints the last value of each series with showEndValues', () => {
    fixture.componentRef.setInput('showEndValues', true);
    fixture.detectChanges();
    expect(texts('text.kc-value')).toEqual(['31', '36.000']);
  });

  it('shows the empty and loading states instead of the chart', () => {
    fixture.componentRef.setInput('series', [{ name: 'Nada', data: [null, null, null] }]);
    fixture.detectChanges();
    expect(points()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');

    fixture.componentRef.setInput('series', SERIES);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('svg')).toBeNull();
  });

  it('shows the legend for several series and toggles them', () => {
    fixture.detectChanges();
    const buttons = element.querySelectorAll<HTMLButtonElement>('.kc-legend__item');
    expect(buttons).toHaveLength(2);
    buttons[1].click();
    fixture.detectChanges();
    expect(lines()).toHaveLength(1);
    expect(points()).toHaveLength(6);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('series', [SERIES[0]]);
    fixture.detectChanges();
    expect(element.querySelector('kc-legend')).toBeNull();
  });

  it('emits pointClick with the data point on click and keyboard', () => {
    fixture.detectChanges();
    const events: ChartPointEvent[] = [];
    fixture.componentInstance.pointClick.subscribe((e) => events.push(e));
    const point = points()[1];
    point.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    point.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      seriesIndex: 0,
      categoryIndex: 1,
      series: 'Jornadas',
      category: 'Jun',
      value: 22,
    });
  });

  it('opens a tooltip with one row per series on focus and closes it on blur', () => {
    fixture.detectChanges();
    const point = points()[7];
    point.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    const tooltip = element.querySelector('.kc-tooltip');
    expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip?.querySelector('.kc-tooltip__title')?.textContent?.trim()).toBe('Jun');
    expect(texts('.kc-tooltip__value')).toEqual(['22', '45.000']);
    expect(tooltip?.querySelectorAll('.kc-tooltip__row--active')).toHaveLength(1);
    point.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(element.querySelector('.kc-tooltip')).toBeNull();
  });
});
