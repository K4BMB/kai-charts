import { fireEvent, render, screen } from '@testing-library/react';
import { KpiCard, type KpiCardProps } from './kpi-card';

describe('KpiCard', () => {
  let element: HTMLElement;

  function mount(props: Partial<KpiCardProps> = {}) {
    const result = render(<KpiCard label="Jornadas ejecutadas" value={128} {...props} />);
    element = result.container;
    return result;
  }

  const root = () => element.firstElementChild as HTMLElement;

  it('renders label, formatted value and subtext', () => {
    mount({ label: 'Actas emitidas', value: 40415, subtext: 'en el período' });
    expect(root().className).toBe('kc-chart kc-kpi');
    expect(element.querySelector('.kc-kpi__label')?.textContent?.trim()).toBe('Actas emitidas');
    expect(element.querySelector('.kc-kpi__value')?.textContent?.trim()).toBe('40.415');
    expect(element.querySelector('.kc-kpi__subtext')?.textContent?.trim()).toBe('en el período');
    expect(screen.getByText('40.415')).not.toBeNull();
  });

  it('renders a string value verbatim', () => {
    mount({ value: 'Bs. 386,40' });
    expect(element.querySelector('.kc-kpi__value')?.textContent?.trim()).toBe('Bs. 386,40');
  });

  it('renders a positive trend as an up chip with success tone', () => {
    mount({ trend: 0.12 });
    const chip = element.querySelector('.kc-trend.kc-trend--up.kc-tone--success');
    expect(chip).not.toBeNull();
    expect(chip?.textContent?.trim()).toBe('+12%');
    expect(chip?.querySelector('svg.kc-trend__arrow')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('decides the tone from the direction and invertTrend', () => {
    const { rerender } = mount({ trend: -0.05, invertTrend: true });
    expect(element.querySelector('.kc-trend.kc-trend--down.kc-tone--success')).not.toBeNull();
    expect(element.querySelector('.kc-trend')?.textContent?.trim()).toBe('-5%');

    rerender(<KpiCard label="Jornadas ejecutadas" value={128} trend={-0.05} />);
    expect(element.querySelector('.kc-trend.kc-trend--down.kc-tone--danger')).not.toBeNull();
    expect(element.querySelector('.kc-tone--success')).toBeNull();
  });

  it('omits the meta line without trend and subtext', () => {
    mount();
    expect(element.querySelector('.kc-kpi__meta')).toBeNull();
    expect(element.querySelector('.kc-trend')).toBeNull();
  });

  it('renders the icon wrapper only when an icon is given', () => {
    const { rerender } = mount({ icon: <svg data-testid="icon" /> });
    const wrapper = element.querySelector('.kc-kpi__icon');
    expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    expect(wrapper?.querySelector('[data-testid="icon"]')).not.toBeNull();

    rerender(<KpiCard label="Jornadas ejecutadas" value={128} />);
    expect(element.querySelector('.kc-kpi__icon')).toBeNull();
  });

  it('exposes the accent color as a custom property on the root', () => {
    mount({ color: '#b45309' });
    expect(root().getAttribute('style')).toContain('--kc-kpi-accent');
    expect(root().style.getPropertyValue('--kc-kpi-accent')).toBe('#b45309');
  });

  it('marks the card busy and swaps the texts for a skeleton when loading', () => {
    mount({ loading: true });
    expect(root().getAttribute('aria-busy')).toBe('true');
    expect(root().getAttribute('role')).toBe('status');
    expect(root().classList.contains('kc-kpi--loading')).toBe(true);
    // Same geometry as a full card: label, value and meta blocks, all painted by the CSS.
    expect(element.querySelector('.kc-kpi__label')?.textContent?.trim()).toBe('');
    expect(element.querySelector('.kc-kpi__value')?.textContent?.trim()).toBe('');
    expect(element.querySelector('.kc-kpi__meta')?.textContent?.trim()).toBe('');
    expect(element.querySelector('.kc-trend')).toBeNull();
    // The skeleton is not interactive: clicking it is a no-op (sanity check on the markup).
    fireEvent.click(root());
    expect(screen.queryByText('Jornadas ejecutadas')).toBeNull();
  });
});
