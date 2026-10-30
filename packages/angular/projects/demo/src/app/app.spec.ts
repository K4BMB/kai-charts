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
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__region')).toHaveLength(25);
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__marker')).toHaveLength(9);
    expect(compiled.querySelector('.kc-map__region--highlighted')?.getAttribute('data-id')).toBe(
      'VE-V',
    );
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
    expect(compiled.querySelectorAll('kc-venezuela-map .kc-map__region--empty')).toHaveLength(25);
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
  it('re-renders the chart when a value is edited', async () => {
    await TestBed.configureTestingModule({ imports: [Playground] }).compileComponents();
    const fixture = TestBed.createComponent(Playground);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const firstBar = () => compiled.querySelector<SVGRectElement>('rect.kc-bar')!;
    const before = firstBar().getAttribute('height');

    const cell = compiled.querySelector<HTMLInputElement>('input[type="number"]')!;
    cell.value = '0';
    cell.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(firstBar().getAttribute('height')).not.toBe(before);
    expect(compiled.querySelector('code')?.textContent).toContain('<kc-bar-chart');
  });
});
