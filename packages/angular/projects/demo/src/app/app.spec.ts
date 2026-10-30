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
  it('renders every showcase chart inside the three blocks', async () => {
    await TestBed.configureTestingModule({ imports: [Showcase] }).compileComponents();
    const fixture = TestBed.createComponent(Showcase);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const titles = Array.from(compiled.querySelectorAll('.block__title')).map((t) =>
      t.textContent?.trim(),
    );
    expect(titles).toEqual(['Indicadores', 'Barras', 'Listas']);
    expect(compiled.querySelectorAll('kc-kpi-card')).toHaveLength(6);
    expect(compiled.querySelectorAll('kc-kpi-card .kc-kpi__icon svg')).toHaveLength(6);
    expect(compiled.querySelectorAll('.kc-trend')).toHaveLength(2);
    expect(compiled.querySelectorAll('kc-bar-chart')).toHaveLength(6);
    expect(compiled.querySelectorAll('rect.kc-bar').length).toBeGreaterThan(50);
    expect(compiled.querySelectorAll('kc-progress-list')).toHaveLength(1);
    expect(compiled.querySelectorAll('li.kc-progress__item')).toHaveLength(5);
    expect(compiled.querySelectorAll('kc-ranking-list')).toHaveLength(1);
    expect(compiled.querySelectorAll('li.kc-ranking__item')).toHaveLength(5);
  });

  it('applies the loading and empty switches to KPIs and lists too', async () => {
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
    expect(compiled.querySelectorAll('kc-ranking-list .kc-state--empty')).toHaveLength(1);

    loading.click();
    await fixture.whenStable();
    expect(compiled.querySelectorAll('kc-kpi-card[aria-busy="true"]')).toHaveLength(6);
    expect(compiled.querySelectorAll('kc-progress-list [aria-busy="true"]')).toHaveLength(1);
    expect(compiled.querySelectorAll('kc-ranking-list [aria-busy="true"]')).toHaveLength(1);
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
