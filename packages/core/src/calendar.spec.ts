import { buildMonthGrid, monthTitle, shiftMonth, weekdayLabels } from './calendar.js';

const kinds = [
  { kind: 'done', name: 'Ejecutadas', tone: 'success' as const },
  { kind: 'pending', name: 'Pendientes', tone: 'info' as const, color: '#2563eb' },
  { kind: 'moved', name: 'Reprogramadas', tone: 'danger' as const },
];
const events = [
  { date: '2026-10-05', kind: 'done' },
  { date: '2026-10-05', kind: 'done' },
  { date: '2026-10-07', kind: 'pending', count: 3 },
  { date: '2026-10-09', kind: 'pending' },
  { date: '2026-10-09', kind: 'moved' },
  { date: '2026-09-28', kind: 'done' },
  { date: '2026-10-20', kind: 'mystery' },
];

describe('buildMonthGrid', () => {
  const grid = buildMonthGrid(2026, 10, events, kinds, {
    today: '2026-10-09',
    selected: '2026-10-09',
  });

  it('starts on Monday by default, pads with the neighbouring months and always has 6 weeks', () => {
    expect(grid.weekdays).toEqual(['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']);
    expect(grid.weeks).toHaveLength(6);
    expect(grid.weeks[0].map((d) => d.day)).toEqual([28, 29, 30, 1, 2, 3, 4]);
    expect(grid.weeks[0][0]).toMatchObject({ iso: '2026-09-28', inMonth: false });
    expect(grid.weeks[0][3]).toMatchObject({ iso: '2026-10-01', inMonth: true });
    expect(grid.weeks[5][6].iso).toBe('2026-11-08');
    expect(grid.title).toBe('octubre de 2026');
  });

  it('buckets events per day and kind, summing counts, and resolves colors', () => {
    const day5 = grid.weeks[1][0];
    expect(day5.iso).toBe('2026-10-05');
    expect(day5.dots).toEqual([
      { kind: 'done', name: 'Ejecutadas', color: 'var(--kc-success, #16a34a)', count: 2 },
    ]);
    const day7 = grid.weeks[1][2];
    expect(day7.dots[0]).toMatchObject({ kind: 'pending', color: '#2563eb', count: 3 });
    const day9 = grid.weeks[1][4];
    expect(day9.dots.map((d) => d.kind)).toEqual(['pending', 'moved']);
    expect(day9.ariaLabel).toBe('viernes 9: 1 Pendientes, 1 Reprogramadas');
    expect(grid.weeks[0][0].dots).toHaveLength(1); // event in the padded September day still shows
  });

  it('flags today, selected and weekends', () => {
    const day9 = grid.weeks[1][4];
    expect(day9).toMatchObject({ isToday: true, isSelected: true, weekend: false });
    expect(grid.weeks[1][5]).toMatchObject({ day: 10, weekend: true, isToday: false });
    expect(grid.weeks[1][0].ariaLabel).toBe('lunes 5: 2 Ejecutadas');
  });

  it('totals per kind for the legend (visible month only) and reports unknown kinds', () => {
    expect(grid.kinds.map((k) => [k.kind, k.total])).toEqual([
      ['done', 2], // the September 28 event is drawn on the padded day but not counted
      ['pending', 4],
      ['moved', 1],
    ]);
    expect(grid.unknownKinds).toEqual(['mystery']);
    expect(grid.weeks[3][1].dots[0]).toMatchObject({ name: 'mystery', count: 1 });
  });

  it('supports Sunday-first weeks, other locales and narrow labels', () => {
    const us = buildMonthGrid(2026, 10, [], kinds, {
      weekStartsOn: 0,
      locale: 'en-US',
      weekdayFormat: 'narrow',
    });
    expect(us.weekdays).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    expect(us.weeks[0].map((d) => d.day)).toEqual([27, 28, 29, 30, 1, 2, 3]);
    expect(us.title).toBe('October 2026');
  });
});

describe('helpers', () => {
  it('formats titles, weekday labels and shifts months across years', () => {
    expect(monthTitle(2026, 1)).toBe('enero de 2026');
    expect(weekdayLabels('es-VE', 0)).toEqual(['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']);
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 10, -22)).toEqual({ year: 2024, month: 12 });
  });
});
