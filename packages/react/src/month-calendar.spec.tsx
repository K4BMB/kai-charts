import { fireEvent, render } from '@testing-library/react';
import type { CalendarDayView, CalendarEvent, CalendarKind } from 'kai-charts-core';
import { MonthCalendar, type MonthCalendarProps, type MonthChangeEvent } from './month-calendar';

const KINDS: CalendarKind[] = [
  { kind: 'done', name: 'Ejecutadas', tone: 'success' },
  { kind: 'pending', name: 'Pendientes', tone: 'info' },
  { kind: 'moved', name: 'Reprogramadas', tone: 'danger' },
];

const EVENTS: CalendarEvent[] = [
  { date: '2026-09-28', kind: 'done' },
  { date: '2026-10-02', kind: 'pending' },
  { date: '2026-10-05', kind: 'done', count: 2 },
  { date: '2026-10-09', kind: 'pending' },
  { date: '2026-10-23', kind: 'pending' },
  { date: '2026-10-23', kind: 'moved' },
  { date: '2026-10-28', kind: 'pending' },
];

const TODAY = '2026-10-09';

describe('MonthCalendar', () => {
  let element: HTMLElement;

  function mount(props: Partial<MonthCalendarProps> = {}) {
    const result = render(
      <MonthCalendar
        year={2026}
        month={10}
        events={EVENTS}
        kinds={KINDS}
        today={TODAY}
        {...props}
      />,
    );
    element = result.container;
    return result;
  }

  const root = () => element.firstElementChild as HTMLElement;
  const weekdays = () =>
    Array.from(element.querySelectorAll<HTMLElement>('th.kc-calendar__weekday'));
  const days = () =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('button.kc-calendar__day'));
  const day = (iso: string) =>
    element.querySelector<HTMLButtonElement>(`button.kc-calendar__day[data-date="${iso}"]`)!;
  const title = () => element.querySelector('.kc-calendar__title')?.textContent?.trim();

  it('renders 7 weekday headers from Monday and a 6×7 grid with outside days', () => {
    mount({ label: 'Calendario de jornadas' });
    expect(root().className).toBe('kc-chart kc-calendar');
    const grid = element.querySelector('table.kc-calendar__grid')!;
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-label')).toBe('Calendario de jornadas');

    expect(weekdays().map((th) => th.textContent?.trim())).toEqual([
      'lun',
      'mar',
      'mié',
      'jue',
      'vie',
      'sáb',
      'dom',
    ]);
    expect(weekdays()[0].getAttribute('abbr')).toBe('lunes');
    expect(weekdays()[6].getAttribute('abbr')).toBe('domingo');
    expect(weekdays()[0].getAttribute('scope')).toBe('col');

    expect(element.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(days()).toHaveLength(42);
    const first = days()[0];
    expect(first.querySelector('.kc-calendar__number')?.textContent).toBe('28');
    expect(first.dataset.date).toBe('2026-09-28');
    expect(first.classList.contains('kc-calendar__day--outside')).toBe(true);
    expect(first.getAttribute('type')).toBe('button');
    expect(day('2026-10-01').classList.contains('kc-calendar__day--outside')).toBe(false);
    expect(day('2026-10-01').querySelector('.kc-calendar__number')?.textContent).toBe('1');
    expect(day('2026-10-03').classList.contains('kc-calendar__day--weekend')).toBe(true);
    expect(day('2026-10-01').classList.contains('kc-calendar__day--weekend')).toBe(false);
  });

  it('titles the month and follows the locale and the first weekday', () => {
    const { rerender } = mount();
    expect(title()).toBe('octubre de 2026');

    rerender(
      <MonthCalendar year={2026} month={10} today={TODAY} locale="en-US" weekStartsOn={0} />,
    );
    expect(title()).toBe('October 2026');
    const labels = weekdays().map((th) => th.textContent?.trim());
    expect(labels).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(labels.map((l) => l?.[0])).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    expect(weekdays()[0].getAttribute('abbr')).toBe('Sunday');
    expect(days()[0].dataset.date).toBe('2026-09-27');
  });

  it('draws one dot per kind with its color, --many above one event, and labels the day', () => {
    mount();
    const dots = (iso: string) =>
      Array.from(day(iso).querySelectorAll<HTMLElement>('.kc-calendar__dot'));

    expect(day('2026-10-05').querySelector('.kc-calendar__dots')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(dots('2026-10-05')).toHaveLength(1);
    expect(dots('2026-10-05')[0].classList.contains('kc-calendar__dot--many')).toBe(true);
    expect(dots('2026-10-05')[0].style.getPropertyValue('--kc-dot-color')).toBe(
      'var(--kc-success, #16a34a)',
    );
    expect(day('2026-10-05').getAttribute('aria-label')).toBe('lunes 5: 2 Ejecutadas');

    expect(dots('2026-10-23')).toHaveLength(2);
    expect(dots('2026-10-23').map((d) => d.classList.contains('kc-calendar__dot--many'))).toEqual([
      false,
      false,
    ]);
    expect(dots('2026-10-23')[1].style.getPropertyValue('--kc-dot-color')).toBe(
      'var(--kc-danger, #dc2626)',
    );
    expect(day('2026-10-23').getAttribute('aria-label')).toBe(
      'viernes 23: 1 Pendientes, 1 Reprogramadas',
    );

    expect(dots('2026-10-06')).toHaveLength(0);
    expect(day('2026-10-06').querySelector('.kc-calendar__dots')).not.toBeNull();
    expect(day('2026-10-06').getAttribute('aria-label')).toBe('martes 6');
  });

  it('marks today and the selected day with aria-pressed', () => {
    const { rerender } = mount({ selected: '2026-10-05' });
    expect(day(TODAY).classList.contains('kc-calendar__day--today')).toBe(true);
    expect(day(TODAY).classList.contains('kc-calendar__day--selected')).toBe(false);
    expect(day(TODAY).hasAttribute('aria-pressed')).toBe(false);

    expect(day('2026-10-05').classList.contains('kc-calendar__day--selected')).toBe(true);
    expect(day('2026-10-05').getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelectorAll('.kc-calendar__day--today')).toHaveLength(1);
    expect(element.querySelectorAll('[aria-pressed]')).toHaveLength(1);

    rerender(<MonthCalendar year={2026} month={10} today={TODAY} selected={TODAY} />);
    expect(day(TODAY).classList.contains('kc-calendar__day--today')).toBe(true);
    expect(day(TODAY).classList.contains('kc-calendar__day--selected')).toBe(true);
    expect(day('2026-10-05').classList.contains('kc-calendar__day--selected')).toBe(false);
  });

  it('lists the kinds with their totals in the legend and hides it on demand', () => {
    const { rerender } = mount();
    const items = Array.from(element.querySelectorAll('.kc-calendar__legend-item'));
    expect(items).toHaveLength(3);
    expect(items.map((li) => li.textContent?.trim())).toEqual([
      'Ejecutadas2',
      'Pendientes4',
      'Reprogramadas1',
    ]);
    expect(items.map((li) => li.querySelector('.kc-calendar__legend-total')?.textContent)).toEqual([
      '2',
      '4',
      '1',
    ]);
    expect(items[0].querySelector('.kc-calendar__legend-swatch')?.getAttribute('style')).toContain(
      'var(--kc-success, #16a34a)',
    );

    rerender(
      <MonthCalendar
        year={2026}
        month={10}
        events={EVENTS}
        kinds={KINDS}
        today={TODAY}
        showLegend={false}
      />,
    );
    expect(element.querySelector('.kc-calendar__legend')).toBeNull();

    rerender(<MonthCalendar year={2026} month={10} events={EVENTS} today={TODAY} />);
    expect(element.querySelector('.kc-calendar__legend')).toBeNull();
  });

  it('emits the previous/next month from the nav buttons and hides them on demand', () => {
    const changes: MonthChangeEvent[] = [];
    const { rerender } = mount({ onMonthChange: (e) => changes.push(e) });
    const nav = () =>
      Array.from(element.querySelectorAll<HTMLButtonElement>('button.kc-calendar__nav'));
    expect(nav()).toHaveLength(2);
    expect(nav().map((b) => b.getAttribute('aria-label'))).toEqual([
      'Mes anterior',
      'Mes siguiente',
    ]);
    expect(nav()[0].querySelector('svg path')?.getAttribute('d')).toBe('M10 3 5 8l5 5');
    expect(nav()[1].querySelector('svg path')?.getAttribute('d')).toBe('M6 3l5 5-5 5');

    fireEvent.click(nav()[0]);
    fireEvent.click(nav()[1]);
    expect(changes).toEqual([
      { year: 2026, month: 9 },
      { year: 2026, month: 11 },
    ]);
    // Controlled: the calendar itself stays on the same month.
    expect(title()).toBe('octubre de 2026');

    rerender(
      <MonthCalendar year={2026} month={12} today={TODAY} onMonthChange={(e) => changes.push(e)} />,
    );
    fireEvent.click(nav()[1]);
    expect(changes[2]).toEqual({ year: 2027, month: 1 });

    rerender(<MonthCalendar year={2026} month={10} today={TODAY} showNav={false} />);
    expect(nav()).toHaveLength(0);
    expect(title()).toBe('octubre de 2026');
  });

  it('emits the day view on click and Enter, only when a handler is attached', () => {
    const clicks: CalendarDayView[] = [];
    const { rerender } = mount({ onDayClick: (d) => clicks.push(d) });
    const target = day('2026-10-05');
    expect(target.classList.contains('kc-calendar__day--clickable')).toBe(true);

    fireEvent.click(target);
    fireEvent.keyDown(target, { key: 'Enter' });
    fireEvent.keyDown(target, { key: ' ' });
    expect(clicks).toHaveLength(3);
    expect(clicks[0].iso).toBe('2026-10-05');
    expect(clicks[0].day).toBe(5);
    expect(clicks[0].events).toEqual([{ date: '2026-10-05', kind: 'done', count: 2 }]);
    expect(clicks[0].dots[0].count).toBe(2);

    rerender(<MonthCalendar year={2026} month={10} events={EVENTS} kinds={KINDS} today={TODAY} />);
    expect(day('2026-10-05').classList.contains('kc-calendar__day--clickable')).toBe(false);
    fireEvent.click(day('2026-10-05'));
    expect(clicks).toHaveLength(3);
  });

  it('splits the footer at the first colon into a bold value', () => {
    const { rerender } = mount({ footer: 'Cumplimiento: 89,3 %' });
    const footer = () => element.querySelector('.kc-calendar__footer');
    expect(footer()?.textContent).toBe('Cumplimiento: 89,3 %');
    expect(footer()?.querySelector('strong')?.textContent).toBe('89,3 %');

    rerender(<MonthCalendar year={2026} month={10} today={TODAY} footer="Sin meta definida" />);
    expect(footer()?.textContent).toBe('Sin meta definida');
    expect(footer()?.querySelector('strong')).toBeNull();

    rerender(<MonthCalendar year={2026} month={10} today={TODAY} />);
    expect(footer()).toBeNull();
  });

  it('shows the loading skeleton and defaults to the current month', () => {
    const { rerender } = mount({ loading: true });
    expect(root().className).toBe('kc-chart kc-calendar');
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.querySelector('.kc-state--loading')?.getAttribute('style')).toContain('320px');
    expect(days()).toHaveLength(0);

    rerender(<MonthCalendar today={TODAY} className="extra" />);
    const now = new Date();
    expect(root().className).toBe('kc-chart kc-calendar extra');
    expect(days()).toHaveLength(42);
    expect(title()).toBe(
      new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(
        new Date(now.getFullYear(), now.getMonth(), 1),
      ),
    );
  });
});
