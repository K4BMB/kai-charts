import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressItem } from 'kai-charts-core';
import { ItemClickEvent } from '../core/events';
import { KcProgressList } from './progress-list';

const ITEMS: ProgressItem[] = [
  { label: 'Amazonas', value: 1.7, tone: 'danger', caption: 'Desatendida · 280 trámites' },
  { label: 'Bolívar', value: 4.1, tone: 'warning', caption: 'Cobertura baja · 2.340 trámites' },
  {
    label: 'Miranda',
    value: 21.3,
    tone: 'success',
    caption: 'Cobertura adecuada · 6.840 trámites',
  },
];

describe('KcProgressList', () => {
  let fixture: ComponentFixture<KcProgressList>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcProgressList] }).compileComponents();
    fixture = TestBed.createComponent(KcProgressList);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('items', ITEMS);
  });

  const rows = () => Array.from(element.querySelectorAll<HTMLLIElement>('li.kc-progress__item'));
  const bars = () => Array.from(element.querySelectorAll<HTMLElement>('.kc-progress__bar'));
  const texts = (selector: string) =>
    Array.from(element.querySelectorAll(selector)).map((el) => el.textContent?.trim());

  it('renders one row per item with label, value and caption', () => {
    fixture.componentRef.setInput('label', 'Densidad de atención');
    fixture.detectChanges();
    expect(rows()).toHaveLength(3);
    expect(element.getAttribute('role')).toBe('list');
    expect(element.getAttribute('aria-label')).toBe('Densidad de atención');
    expect(texts('.kc-progress__label')).toEqual(['Amazonas', 'Bolívar', 'Miranda']);
    expect(texts('.kc-progress__value')).toEqual(['1,7', '4,1', '21,3']);
    expect(texts('.kc-progress__caption')[0]).toBe('Desatendida · 280 trámites');
    expect(rows()[0].getAttribute('aria-label')).toBe('Amazonas: 1,7');
  });

  it('sizes the bars relative to the largest value or the given max', () => {
    fixture.detectChanges();
    expect(bars().map((b) => b.style.width)).toEqual(['7.98%', '19.25%', '100%']);

    fixture.componentRef.setInput('max', 42.6);
    fixture.detectChanges();
    expect(bars()[2].style.width).toBe('50%');
  });

  it('applies the tone class and row color from the core, custom color first', () => {
    fixture.componentRef.setInput('items', [
      ...ITEMS,
      { label: 'Zulia', value: 3, tone: 'danger', color: 'rebeccapurple' },
    ]);
    fixture.detectChanges();
    const [first, , , custom] = rows();
    expect(first.classList.contains('kc-tone--danger')).toBe(true);
    expect(first.style.getPropertyValue('--kc-row-color')).toBe('var(--kc-danger, #dc2626)');
    expect(custom.style.getPropertyValue('--kc-row-color')).toBe('rebeccapurple');
  });

  it('exposes each bar as a progressbar', () => {
    fixture.detectChanges();
    const track = element.querySelector('.kc-progress__track');
    expect(track?.getAttribute('role')).toBe('progressbar');
    expect(track?.getAttribute('aria-valuemin')).toBe('0');
    expect(track?.getAttribute('aria-valuemax')).toBe('21.3');
    expect(track?.getAttribute('aria-valuenow')).toBe('1.7');
    expect(track?.getAttribute('aria-label')).toBe('Amazonas: 1,7');
  });

  it('hides the values on demand', () => {
    fixture.componentRef.setInput('showValues', false);
    fixture.detectChanges();
    expect(element.querySelector('.kc-progress__value')).toBeNull();
    expect(rows()).toHaveLength(3);
  });

  it('shows the empty and loading states instead of the rows', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(rows()).toHaveLength(0);
    expect(element.querySelector('.kc-state--empty')?.textContent?.trim()).toBe('Sin datos');
    expect(element.getAttribute('role')).toBeNull();

    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(rows()).toHaveLength(0);
    const skeleton = element.querySelector<HTMLElement>('[aria-busy="true"]');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.style.height).toBe('168px');
  });

  it('emits itemClick with the item and its index on click and keyboard', () => {
    fixture.detectChanges();
    const events: ItemClickEvent<ProgressItem>[] = [];
    fixture.componentInstance.itemClick.subscribe((e) => events.push(e));
    const row = rows()[1];
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.classList.contains('kc-progress__item--clickable')).toBe(true);
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ item: ITEMS[1], index: 1 });
    expect(events[1]).toEqual({ item: ITEMS[1], index: 1 });
  });
});
