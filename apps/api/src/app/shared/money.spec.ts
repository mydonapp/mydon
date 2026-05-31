import { CENT, roundBaseAmount } from './money';

describe('roundBaseAmount', () => {
  it('rounds to two decimals (cents)', () => {
    expect(roundBaseAmount(6.54285)).toBe(6.54);
    expect(roundBaseAmount(5.3)).toBe(5.3);
    expect(roundBaseAmount(0)).toBe(0);
    expect(roundBaseAmount(92)).toBe(92);
  });

  it('rounds a foreign conversion the same way the client sizes the counter-leg', () => {
    // 14500 KRW × 0.00053 = 7.685; the foreign leg and its base-currency counter-leg
    // (also rounded with Math.round(x*100)/100) must land on the same cent so they balance.
    const foreignBase = roundBaseAmount(14500 * 0.00053);
    const counterBase = roundBaseAmount(7.69 * 1);
    expect(foreignBase).toBe(7.69);
    expect(counterBase).toBe(7.69);
    expect(foreignBase).toBe(counterBase);
  });

  it('exposes one cent as CENT', () => {
    expect(CENT).toBe(0.01);
  });
});
