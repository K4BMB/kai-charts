import { niceDomain, scaleLinear, tickStep } from './scale';

describe('tickStep', () => {
  it('picks 1-2-5 steps close to the requested count', () => {
    expect(tickStep(100, 5)).toBe(20);
    expect(tickStep(30000, 4)).toBe(10000);
    expect(tickStep(7, 5)).toBe(1);
    expect(tickStep(0.9, 4)).toBe(0.2);
  });

  it('falls back to 1 for a zero or negative span', () => {
    expect(tickStep(0, 5)).toBe(1);
    expect(tickStep(-3, 5)).toBe(1);
  });
});

describe('niceDomain', () => {
  it('always includes zero and ends on a tick', () => {
    const domain = niceDomain(12, 87, 5);
    expect(domain.min).toBe(0);
    expect(domain.max).toBe(100);
    expect(domain.ticks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('extends below zero for negative values', () => {
    const domain = niceDomain(-15, 40, 5);
    expect(domain.min).toBe(-20);
    expect(domain.ticks[0]).toBe(-20);
    expect(domain.ticks.at(-1)).toBe(40);
  });

  it('renders an all-zero dataset as [0, 1] with integer ticks', () => {
    expect(niceDomain(0, 0, 5, true).ticks).toEqual([0, 1]);
  });

  it('never uses fractional steps for integer data', () => {
    const domain = niceDomain(0, 3, 6, true);
    expect(domain.step).toBe(1);
    expect(domain.ticks).toEqual([0, 1, 2, 3]);
  });

  it('avoids floating point noise in ticks', () => {
    expect(niceDomain(0, 0.9, 4).ticks).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });
});

describe('scaleLinear', () => {
  it('maps the domain onto the range, including inverted ranges', () => {
    const y = scaleLinear(0, 100, 200, 0);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
    expect(y(100)).toBe(0);
  });

  it('does not divide by zero on a flat domain', () => {
    expect(scaleLinear(5, 5, 0, 10)(5)).toBe(0);
  });
});
