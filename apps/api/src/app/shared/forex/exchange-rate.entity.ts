import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Currency } from '../currency';
import { ColumnDecimalTransformer } from '../decimal.transformer';

/**
 * Cache of FX rates fetched from external providers. Keyed by `(date, fromCurrency, toCurrency)`
 * so a given rate is stored exactly once per day and direction. Rates are immutable historical
 * facts — once recorded for a given date+pair they don't change.
 *
 * `rate` is the multiplier from `fromCurrency` → `toCurrency`: `amountInTo = amountInFrom * rate`.
 */
@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryColumn({ type: 'date' })
  declare date: string;

  @PrimaryColumn({ name: 'from_currency', type: 'enum', enum: Currency, enumName: 'currency_enum' })
  declare fromCurrency: Currency;

  @PrimaryColumn({ name: 'to_currency', type: 'enum', enum: Currency, enumName: 'currency_enum' })
  declare toCurrency: Currency;

  @Column({ type: 'decimal', precision: 18, scale: 8, transformer: new ColumnDecimalTransformer() })
  declare rate: number;

  @Column({ type: 'varchar', default: 'frankfurter' })
  declare source: string;
}
