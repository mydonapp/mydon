/** Decimal places stored for monetary base amounts — matches the `entries.base_amount` column
 *  (`decimal(14,2)`). The ledger base currency is always a 2-decimal (cent) currency. */
export const BASE_AMOUNT_SCALE = 2;

/** Smallest representable base-currency unit (one cent). */
export const CENT = 0.01;

/**
 * Round a monetary value to the base-amount scale (cents), the way `base_amount` is persisted.
 *
 * Cross-currency legs derive their base amount from `amount * fxRate`, which routinely lands on a
 * fractional cent (e.g. 14500 KRW × 0.00053 = 7.685). The balance check must compare the *stored*
 * cent-scale base amounts, not the raw products — otherwise a foreign leg at 7.685 fails to balance
 * against its 7.69 base-currency counterpart even though both persist as the same cent value.
 *
 * Uses plain `Math.round(x * 100) / 100` so it is bit-identical to how the frontend sizes the
 * balancing counter-leg (`Math.round(amount * fxRate * 100) / 100`). The two sides therefore always
 * round to the *same* cent; switching to a half-cent-aware rounding here would round one leg up while
 * the client rounded the other down, reintroducing a one-cent imbalance.
 */
export function roundBaseAmount(value: number): number {
  const scale = 10 ** BASE_AMOUNT_SCALE;
  return Math.round(value * scale) / scale;
}
