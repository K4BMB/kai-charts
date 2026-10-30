import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KcIcon, KcKpiCard } from './kpi-card';

@Component({
  imports: [KcKpiCard, KcIcon],
  template: `
    <kc-kpi-card label="Con ícono" [value]="1">
      <svg kcIcon viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>
    </kc-kpi-card>
  `,
})
class IconHost {}

describe('KcKpiCard', () => {
  let fixture: ComponentFixture<KcKpiCard>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KcKpiCard, IconHost] }).compileComponents();
    fixture = TestBed.createComponent(KcKpiCard);
    element = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('label', 'Actas emitidas');
    fixture.componentRef.setInput('value', 40415);
  });

  const text = (selector: string) => element.querySelector(selector)?.textContent?.trim();

  it('renders label, formatted value and subtext', () => {
    fixture.componentRef.setInput('subtext', 'en el período');
    fixture.detectChanges();
    expect(element.classList.contains('kc-kpi')).toBe(true);
    expect(text('.kc-kpi__label')).toBe('Actas emitidas');
    expect(text('.kc-kpi__value')).toBe('40.415');
    expect(text('.kc-kpi__subtext')).toBe('en el período');
  });

  it('renders a string value verbatim', () => {
    fixture.componentRef.setInput('value', 'Bs. 386,40');
    fixture.detectChanges();
    expect(text('.kc-kpi__value')).toBe('Bs. 386,40');
  });

  it('renders a positive trend as an upward success chip', () => {
    fixture.componentRef.setInput('trend', 0.12);
    fixture.detectChanges();
    const chip = element.querySelector('.kc-trend.kc-trend--up.kc-tone--success');
    expect(chip).not.toBeNull();
    expect(chip?.textContent?.trim()).toBe('+12%');
    expect(chip?.querySelector('svg.kc-trend__arrow')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('decides the tone from the direction and invertTrend', () => {
    fixture.componentRef.setInput('trend', -0.05);
    fixture.componentRef.setInput('invertTrend', true);
    fixture.detectChanges();
    expect(element.querySelector('.kc-trend.kc-trend--down.kc-tone--success')).not.toBeNull();
    expect(text('.kc-trend')).toBe('-5%');

    fixture.componentRef.setInput('invertTrend', false);
    fixture.detectChanges();
    expect(element.querySelector('.kc-trend.kc-tone--danger')).not.toBeNull();
    expect(element.querySelector('.kc-tone--success')).toBeNull();
  });

  it('omits the meta row without trend and subtext', () => {
    fixture.detectChanges();
    expect(element.querySelector('.kc-kpi__meta')).toBeNull();
    expect(element.querySelector('.kc-trend')).toBeNull();
  });

  it('renders the icon wrapper only when an icon is projected', () => {
    fixture.detectChanges();
    expect(element.querySelector('.kc-kpi__icon')).toBeNull();

    const host = TestBed.createComponent(IconHost);
    host.detectChanges();
    const wrapper = host.nativeElement.querySelector('.kc-kpi__icon') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper.querySelector('svg[kcIcon]')).not.toBeNull();
  });

  it('exposes the accent color as a custom property on the root', () => {
    fixture.componentRef.setInput('color', '#b45309');
    fixture.detectChanges();
    expect(element.getAttribute('style')).toContain('--kc-kpi-accent');
    expect(element.style.getPropertyValue('--kc-kpi-accent')).toBe('#b45309');

    fixture.componentRef.setInput('color', undefined);
    fixture.detectChanges();
    expect(element.style.getPropertyValue('--kc-kpi-accent')).toBe('');
  });

  it('marks the root as a busy skeleton while loading', () => {
    fixture.componentRef.setInput('trend', 0.12);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(element.getAttribute('aria-busy')).toBe('true');
    expect(element.getAttribute('role')).toBe('status');
    expect(element.classList.contains('kc-kpi--loading')).toBe(true);
    expect(text('.kc-kpi__label')).toBe('');
    expect(element.querySelector('.kc-trend')).toBeNull();

    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    expect(element.getAttribute('aria-busy')).toBeNull();
    expect(element.classList.contains('kc-kpi--loading')).toBe(false);
    expect(text('.kc-kpi__value')).toBe('40.415');
  });
});
