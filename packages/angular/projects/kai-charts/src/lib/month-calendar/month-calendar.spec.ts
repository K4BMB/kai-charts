import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarDayView, CalendarEvent, CalendarKind } from 'kai-charts-core';
import { KcMonthCalendar, MonthChangeEvent } from './month-calendar';

const KINDS: CalendarKind[] = [
  { kind: 'done', name: 'Ejecutadas', tone: 'success' },
  { kind: 'pending', name: 'Pendientes', tone: 'info', color: '#2563eb' },
  { kind: 'moved', name: 'Reprogramadas', tone: 'danger' },
];

const EVENTS: CalendarEvent[] = [
  { date: '2026-10-05', kind: 'done' },
  { date: '2026-10-05', kind: 'done' },
  { date: '2026-10-07', kind: 'pending', count: 3 },
  { date: '2026-10-09', kind: 'pending' },
  { date: '2026-10-09', kind: 'moved' },
  { date: '2026-09-28', kind: 'done' },
];

describe('KcMonthCalendar', () => {
  let fixture: ComponentFixture<KcMonthCalendar>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcMonthCalendar] }).compileComponents();
    fixture = TestBed.createComponent(KcMonthCalendar);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 10);
    fixture.componentRef.setInput('events', EVENTS);
    fixture.componentRef.setInput('kinds', KINDS);
    fixture.componentRef.setInput('today', '2026-10-09');
    fixture.componentRef.setInput('selected', '2026-10-09');
  });

  const days = () => Array.from(element.querySelectorAll<HTMLButtonElement>('.kc-calendar__day'));
  const day = (iso: string) => element.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector)).map((el) => el.textContent?.trim());
  const navs = () => Array.from(element.querySelectorAll<HTMLButtonElement>('.kc-calendar__nav'));

  it('renders 7 weekday headers from Monday and a 6×7 grid padded with the neighbouring months', () => {
    fixture.componentRef.setInput('label', 'Jornadas de octubre');
    fixture.detectChanges();
    expect(element.classList.contains('kc-calendar')).toBe(true);
    const table = element.querySelector('table.kc-calendar__grid')!;
    expect(table.getAttribute('role')).toBe('grid');
    expect(table.getAttribute('aria-label')).toBe('Jornadas de octubre');
    expect(texts('th.kc-calendar__weekday')).toEqual([
      'lun',
      'mar',
      'mié',
      'jue',
      'vie',
      'sáb',
      'dom',
    ]);
    expect(element.querySelector('th.kc-calendar__weekday')?.getAttribute('abbr')).toBe('lunes');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(days()).toHaveLength(42);
    const [first, , , fourth] = days();
    expect(first.querySelector('.kc-calendar__number')?.textContent?.trim()).toBe('28');
    expect(first.classList.contains('kc-calendar__day--outside')).toBe(true);
    expect(first.getAttribute('data-date')).toBe('2026-09-28');
    expect(first.getAttribute('type')).toBe('button');
    expect(fourth.querySelector('.kc-calendar__number')?.textContent?.trim()).toBe('1');
    expect(fourth.classList.contains('kc-calendar__day--outside')).toBe(false);
    expect(fourth.getAttribute('data-date')).toBe('2026-10-01');
    expect(day('2026-10-10').classList.contains('kc-calendar__day--weekend')).toBe(true);
    expect(day('2026-10-09').classList.contains('kc-calendar__day--weekend')).toBe(false);
    expect(days().every((d) => d.classList.contains('kc-calendar__day--clickable'))).toBe(true);
  });

  it('titles the month and follows locale and weekStartsOn', () => {
    fixture.detectChanges();
    expect(element.querySelector('.kc-calendar__title')?.textContent?.trim()).toBe(
      'octubre de 2026',
    );
    expect(element.querySelector('.kc-calendar__title')?.getAttribute('aria-live')).toBe('polite');

    fixture.componentRef.setInput('locale', 'en-US');
    fixture.componentRef.setInput('weekStartsOn', 0);
    fixture.detectChanges();
    expect(texts('th.kc-calendar__weekday')).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    expect(element.querySelector('th.kc-calendar__weekday')?.getAttribute('abbr')).toBe('Sunday');
    expect(element.querySelector('.kc-calendar__title')?.textContent?.trim()).toBe('October 2026');
    expect(days()[0].getAttribute('data-date')).toBe('2026-09-27');
  });

  it('falls back to the current month when year and month are not provided', () => {
    fixture.componentRef.setInput('year', undefined);
    fixture.componentRef.setInput('month', undefined);
    fixture.detectChanges();
    const now = new Date();
    const expected = new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
    expect(element.querySelector('.kc-calendar__title')?.textContent?.trim()).toBe(expected);
  });

  it('draws one dot per kind with its color, --many above one event, and an aria label', () => {
    fixture.detectChanges();
    const day5 = day('2026-10-05');
    const dots5 = Array.from(day5.querySelectorAll<HTMLElement>('.kc-calendar__dot'));
    expect(dots5).toHaveLength(1);
    expect(dots5[0].classList.contains('kc-calendar__dot--many')).toBe(true);
    expect(dots5[0].style.getPropertyValue('--kc-dot-color')).toBe('var(--kc-success, #16a34a)');
    expect(day5.getAttribute('aria-label')).toBe('lunes 5: 2 Ejecutadas');

    const dots7 = Array.from(day('2026-10-07').querySelectorAll<HTMLElement>('.kc-calendar__dot'));
    expect(dots7[0].style.getPropertyValue('--kc-dot-color')).toBe('#2563eb');
    expect(dots7[0].classList.contains('kc-calendar__dot--many')).toBe(true);

    const day9 = day('2026-10-09');
    const dots9 = Array.from(day9.querySelectorAll<HTMLElement>('.kc-calendar__dot'));
    expect(dots9).toHaveLength(2);
    expect(dots9.some((d) => d.classList.contains('kc-calendar__dot--many'))).toBe(false);
    expect(dots9[1].style.getPropertyValue('--kc-dot-color')).toBe('var(--kc-danger, #dc2626)');
    expect(day9.getAttribute('aria-label')).toBe('viernes 9: 1 Pendientes, 1 Reprogramadas');
    expect(day9.querySelector('.kc-calendar__dots')?.getAttribute('aria-hidden')).toBe('true');

    expect(day('2026-10-06').querySelectorAll('.kc-calendar__dot')).toHaveLength(0);
    expect(day('2026-10-06').getAttribute('aria-label')).toBe('martes 6');
    // An event in the padded September day still shows.
    expect(day('2026-09-28').querySelectorAll('.kc-calendar__dot')).toHaveLength(1);
  });

  it('marks today and the selected day, with aria-pressed only on the selected one', () => {
    fixture.detectChanges();
    const day9 = day('2026-10-09');
    expect(day9.classList.contains('kc-calendar__day--today')).toBe(true);
    expect(day9.classList.contains('kc-calendar__day--selected')).toBe(true);
    expect(day9.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelectorAll('[aria-pressed]')).toHaveLength(1);
    expect(element.querySelectorAll('.kc-calendar__day--today')).toHaveLength(1);

    fixture.componentRef.setInput('selected', '2026-10-12');
    fixture.detectChanges();
    expect(day9.classList.contains('kc-calendar__day--selected')).toBe(false);
    expect(day9.hasAttribute('aria-pressed')).toBe(false);
    expect(day('2026-10-12').getAttribute('aria-pressed')).toBe('true');
    expect(day('2026-10-12').classList.contains('kc-calendar__day--today')).toBe(false);
  });

  it('lists the kinds with their totals in the legend and hides it on demand', () => {
    fixture.detectChanges();
    const items = Array.from(element.querySelectorAll('.kc-calendar__legend-item'));
    expect(items.map((i) => i.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Ejecutadas 2',
      'Pendientes 4',
      'Reprogramadas 1',
    ]);
    expect(texts('.kc-calendar__legend-total')).toEqual(['2', '4', '1']);
    expect(items[1].querySelector('.kc-calendar__legend-swatch')?.getAttribute('style')).toMatch(
      /background:\s*(#2563eb|rgb\(37, 99, 235\))/,
    );

    fixture.componentRef.setInput('showLegend', false);
    fixture.detectChanges();
    expect(element.querySelector('.kc-calendar__legend')).toBeNull();

    fixture.componentRef.setInput('showLegend', true);
    fixture.componentRef.setInput('kinds', []);
    fixture.detectChanges();
    expect(element.querySelector('.kc-calendar__legend')).toBeNull();
  });

  it('emits monthChange from the nav buttons without changing its own month', () => {
    fixture.detectChanges();
    const changes: MonthChangeEvent[] = [];
    fixture.componentInstance.monthChange.subscribe((e) => changes.push(e));
    const [prev, next] = navs();
    expect(prev.getAttribute('aria-label')).toBe('Mes anterior');
    expect(next.getAttribute('aria-label')).toBe('Mes siguiente');
    expect(prev.querySelector('svg path')?.getAttribute('d')).toBe('M10 3 5 8l5 5');
    expect(next.querySelector('svg path')?.getAttribute('d')).toBe('M6 3l5 5-5 5');
    prev.click();
    next.click();
    expect(changes).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 11 },
    ]);
    expect(element.querySelector('.kc-calendar__title')?.textContent?.trim()).toBe(
      'octubre de 2026',
    );

    fixture.componentRef.setInput('month', 12);
    fixture.detectChanges();
    next.click();
    expect(changes[2]).toEqual({ year: 2027, month: 1 });

    fixture.componentRef.setInput('showNav', false);
    fixture.detectChanges();
    expect(navs()).toHaveLength(0);
    expect(element.querySelector('.kc-calendar__title')).not.toBeNull();
  });

  it('emits dayClick with the day view on click and Enter', () => {
    fixture.detectChanges();
    const clicks: CalendarDayView[] = [];
    fixture.componentInstance.dayClick.subscribe((d) => clicks.push(d));
    const day5 = day('2026-10-05');
    day5.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    day5.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicks).toHaveLength(2);
    expect(clicks[0]).toMatchObject({ iso: '2026-10-05', day: 5, inMonth: true });
    expect(clicks[0].events).toHaveLength(2);
    expect(clicks[1]).toBe(clicks[0]);
  });

  it('splits the footer at the first colon into a bold value', () => {
    fixture.detectChanges();
    expect(element.querySelector('.kc-calendar__footer')).toBeNull();

    fixture.componentRef.setInput('footer', 'Cumplimiento: 89,3 %');
    fixture.detectChanges();
    const footer = element.querySelector('p.kc-calendar__footer')!;
    expect(footer.textContent?.replace(/\s+/g, ' ').trim()).toBe('Cumplimiento: 89,3 %');
    expect(footer.querySelector('strong')?.textContent?.trim()).toBe('89,3 %');

    fixture.componentRef.setInput('footer', 'Sin corte');
    fixture.detectChanges();
    expect(footer.textContent?.trim()).toBe('Sin corte');
    expect(footer.querySelector('strong')).toBeNull();
  });

  it('shows the loading skeleton instead of the grid', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(days()).toHaveLength(0);
    expect(element.querySelector('.kc-calendar__head')).toBeNull();
    const skeleton = element.querySelector<HTMLElement>('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.style.height).toBe('320px');
  });
});
