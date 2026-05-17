/**
 * Supported currencies across the whole system. The list is intentionally bounded so the FX
 * cache backfill stays predictable and we never accept a currency we can't price. Adding a new
 * currency requires: (1) extend this enum, (2) generate a migration, (3) confirm frankfurter
 * supports it.
 */
export enum Currency {
  CHF = 'CHF',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  JPY = 'JPY',
  AUD = 'AUD',
  CAD = 'CAD',
  CNY = 'CNY',
  KRW = 'KRW',
  INR = 'INR',
  SGD = 'SGD',
  HKD = 'HKD',
  NZD = 'NZD',
  SEK = 'SEK',
  NOK = 'NOK',
}

export const CURRENCY_VALUES: readonly Currency[] = Object.values(Currency);
