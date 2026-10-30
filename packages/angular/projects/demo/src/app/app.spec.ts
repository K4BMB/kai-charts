import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { Playground } from './playground/playground';
import { Showcase } from './showcase/showcase';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('renders the header with both sections', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('kai-charts');
    expect(compiled.querySelectorAll('nav a')).toHaveLength(4);
  });
});

describe('Showcase', () => {
  it('renders every showcase chart inside the four blocks', async () => {
    await TestBed.configureTestingModule({ imports: [Showcase] }).compileComponents();
    const fixture = TestBed.createComponent(Showcase);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const titles = Array.from(compiled.querySelectorAll('.block__title')).map((t) =>
      t.textContent?.trim(),
    );
    expect(titles).toEqual(['Indicadores', 'Mapa', 'Barras y líneas', 'Listas y anillos']);
    expect(compiled.querySelectorAll('kc-kpi-card')).toHaveLength(6);
    expect(compiled.querySelectorAll('kc-kpi-card .kc-kpi__icon svg')).toHaveLength(6);
    expect(compiled.querySelectorAll('kc-kpi-card .kc-trend')).toHaveLength(2);
    expect(compiled.querySelectorAll('kc-venezuela-map')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__region')).toHaveLength(26);
    // Showcase map: capitals in every state, no mobile-unit markers and no highlighted outline.
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__capital')).toHaveLength(24);
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__marker')).toHaveLength(0);
    expect(compiled.querySelector('.kc-map__region--highlighted')).toBeNull();
    expect(compiled.querySelectorAll('kc-bar-chart')).toHaveLength(6);
    expect(compiled.querySelectorAll('rect.kc-bar').length).toBeGreaterThan(50);
    expect(compiled.querySelectorAll('kc-line-chart')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-line-chart path.kc-line')).toHaveLength(2);
    expect(compiled.querySelectorAll('kc-line-chart path.kc-area')).toHaveLength(2);
    expect(compiled.querySelectorAll('kc-progress-list')).toHaveLength(1);
    expect(compiled.querySelectorAll('li.kc-progress__item')).toHaveLength(5);
    expect(compiled.querySelectorAll('kc-ranking-list')).toHaveLength(2);
    expect(compiled.querySelectorAll('li.kc-ranking__item')).toHaveLength(10);
    expect(compiled.querySelectorAll('kc-ring-chart')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ring-chart circle.kc-ring__arc')).toHaveLength(3);
    expect(compiled.querySelector('kc-ring-chart .kc-trend')?.textContent?.trim()).toBe('+3,8%');
    expect(compiled.querySelectorAll('kc-month-calendar')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-month-calendar .kc-calendar__day')).toHaveLength(42);
    expect(
      compiled.querySelector('kc-month-calendar .kc-calendar__title')?.textContent?.trim(),
    ).toBe('octubre de 2026');
    expect(compiled.querySelectorAll('kc-ranking-table')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ranking-table .kc-ranking-table__row')).toHaveLength(5);
    expect(
      compiled.querySelector('kc-ranking-table th[aria-sort="descending"]')?.textContent?.trim(),
    ).toBe('Trámites▾');
  });

  it('controls the table sort and the calendar month from the host', async () => {
    await TestBed.configureTestingModule({ imports: [Showcase] }).compileComponents();
    const fixture = TestBed.createComponent(Showcase);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = () =>
      Array.from(compiled.querySelectorAll('kc-ranking-table .kc-ranking-table__label')).map((l) =>
        l.textContent?.trim(),
      );
    expect(labels()[0]).toBe('Zulia');
    compiled.querySelector<HTMLButtonElement>('kc-ranking-table th button')!.click();
    await fixture.whenStable();
    expect(labels()[0]).toBe('Dtto. Capital');
    expect(compiled.querySelector('kc-ranking-table th[aria-sort="ascending"]')).not.toBeNull();

    const title = () =>
      compiled.querySelector('kc-month-calendar .kc-calendar__title')?.textContent?.trim();
    const [prev, next] = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>('kc-month-calendar .kc-calendar__nav'),
    );
    next.click();
    await fixture.whenStable();
    expect(title()).toBe('noviembre de 2026');
    prev.click();
    await fixture.whenStable();
    prev.click();
    await fixture.whenStable();
    expect(title()).toBe('septiembre de 2026');
  });

  it('applies the loading and empty switches to every chart', async () => {
    await TestBed.configureTestingModule({ imports: [Showcase] }).compileComponents();
    const fixture = TestBed.createComponent(Showcase);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const [loading, empty] = Array.from(
      compiled.querySelectorAll<HTMLInputElement>('.controls input'),
    );

    empty.click();
    await fixture.whenStable();
    expect(compiled.querySelectorAll('kc-progress-list .kc-state--empty')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ranking-list .kc-state--empty')).toHaveLength(2);
    expect(compiled.querySelectorAll('kc-line-chart .kc-state--empty')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ring-chart .kc-state--empty')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ranking-table .kc-state--empty')).toHaveLength(1);
    // The calendar has no empty state: without events it still draws the 42 days, without dots.
    expect(compiled.querySelectorAll('kc-month-calendar .kc-calendar__day')).toHaveLength(42);
    expect(compiled.querySelectorAll('kc-month-calendar .kc-calendar__dot')).toHaveLength(0);
    // The map has no empty state: it keeps drawing the grey regions without a legend.
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__region--empty')).toHaveLength(26);
    expect(compiled.querySelector('kc-venezuela-map .kc-map__legend')).toBeNull();

    loading.click();
    await fixture.whenStable();
    expect(compiled.querySelectorAll('kc-kpi-card[aria-busy="true"]')).toHaveLength(6);
    expect(compiled.querySelectorAll('kc-progress-list [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ranking-list [aria-busy="true"]')).toHaveLength(2);
    expect(compiled.querySelectorAll('kc-venezuela-map [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-line-chart [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ring-chart [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ranking-table [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-month-calendar [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-month-calendar .kc-calendar__day')).toHaveLength(0);
  });
});

describe('Playground', () => {
  const SANDBOXES: Record<string, string> = {
    bar: 'kc-bar-chart',
    line: 'kc-line-chart',
    ring: 'kc-ring-chart',
    kpi: 'kc-kpi-card',
    progress: 'kc-progress-list',
    ranking: 'kc-ranking-list',
    table: 'kc-ranking-table',
    calendar: 'kc-month-calendar',
    map: 'kc-venezuela-map',
  };

  async function create(chart: string) {
    await TestBed.configureTestingModule({ imports: [Playground] }).compileComponents();
    const fixture = TestBed.createComponent(Playground);
    fixture.componentRef.setInput('chart', chart);
    await fixture.whenStable();
    return { fixture, compiled: fixture.nativeElement as HTMLElement };
  }

  it('re-renders the chart when a value is edited', async () => {
    const { fixture, compiled } = await create('bar');
    const firstBar = () => compiled.querySelector<SVGRectElement>('rect.kc-bar')!;
    const before = firstBar().getAttribute('height');

    const cell = compiled.querySelector<HTMLInputElement>('input[type="number"]')!;
    cell.value = '0';
    cell.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(firstBar().getAttribute('height')).not.toBe(before);
    expect(compiled.querySelector('code')?.textContent).toContain('<kc-bar-chart');
  });

  it('shows the nine chips and marks the active one', async () => {
    const { compiled } = await create('ring');
    const chips = Array.from(compiled.querySelectorAll<HTMLAnchorElement>('.chart-picker .chip'));
    expect(chips).toHaveLength(9);
    expect(chips.map((c) => c.textContent?.trim())).toEqual([
      'Barras',
      'Líneas',
      'Anillos',
      'KPI',
      'Progreso',
      'Ranking',
      'Tabla',
      'Calendario',
      'Mapa',
    ]);
    expect(chips.map((c) => c.getAttribute('href'))).toContain('#/playground/map');
    const active = compiled.querySelectorAll('.chip--active');
    expect(active).toHaveLength(1);
    expect(active[0].textContent?.trim()).toBe('Anillos');
    expect(active[0].getAttribute('aria-current')).toBe('page');
    expect(compiled.querySelectorAll('.chip[aria-current="page"]')).toHaveLength(1);
  });

  it.each(Object.entries(SANDBOXES))('renders the %s sandbox', async (chart, selector) => {
    const { compiled } = await create(chart);
    expect(compiled.querySelector(`.stage ${selector}`)).not.toBeNull();
    expect(compiled.querySelectorAll('.stage .status')).toHaveLength(1);
    expect(compiled.querySelector('.panel pre code')?.textContent).toContain(`<${selector}`);
  });

  it('falls back to the bar sandbox for unknown ids', async () => {
    const { compiled } = await create('nope');
    expect(compiled.querySelector('.stage kc-bar-chart')).not.toBeNull();
    expect(compiled.querySelector('.chip--active')?.textContent?.trim()).toBe('Barras');
  });

  it('re-renders the ranking when a row value is edited', async () => {
    const { fixture, compiled } = await create('ranking');
    const firstValue = () =>
      compiled.querySelector('.kc-ranking__value')?.textContent?.trim() ?? '';
    const before = firstValue();
    expect(before).toBe('5.260');

    const cell = compiled.querySelector<HTMLInputElement>('app-rows-editor input[type="number"]')!;
    cell.value = '0';
    cell.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(firstValue()).not.toBe(before);
    expect(firstValue()).toBe('4.940');
    expect(compiled.querySelector('.panel pre code')?.textContent).toContain('value: 0');
  });

  it('keeps the table sort controlled from the sandbox and reports the event', async () => {
    const { fixture, compiled } = await create('table');
    const status = () => compiled.querySelector('.status')?.textContent?.replace(/\s+/g, ' ');
    expect(status()).toContain('rowClick');
    compiled.querySelector<HTMLButtonElement>('kc-ranking-table th button')!.click();
    await fixture.whenStable();
    expect(compiled.querySelector('kc-ranking-table th[aria-sort="ascending"]')).not.toBeNull();
    expect(status()).toContain('Último evento: sortChange · procedures · asc');
  });
});
