export const CURRENCIES = [
  'CHF',
  'EUR',
  'USD',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CNY',
  'KRW',
  'INR',
  'SGD',
  'HKD',
  'NZD',
  'SEK',
  'NOK',
] as const;

export type Currency = (typeof CURRENCIES)[number];
