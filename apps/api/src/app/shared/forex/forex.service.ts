import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Between, Repository } from 'typeorm';
import { Account } from '../../accounts/accounts.entity';
import { Ledger } from '../../ledgers/ledger.entity';
import { Currency } from '../currency';
import { ExchangeRate } from './exchange-rate.entity';

export interface BackfillResult {
  fromCurrencies: number;
  rowsInserted: number;
}

@Injectable()
export class ForexService {
  private readonly logger = new Logger(ForexService.name);

  /** Dedupes concurrent cache-miss fetches so a burst of identical lookups makes one HTTP call. */
  private readonly inFlight = new Map<string, Promise<number>>();

  constructor(
    @InjectRepository(ExchangeRate)
    private exchangeRateRepository: Repository<ExchangeRate>,
    @InjectRepository(Ledger)
    private ledgerRepository: Repository<Ledger>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  public async convertCurrency(amount: number, from: Currency, to: Currency, date: Date): Promise<number> {
    if (from === to) {
      return amount;
    }
    const rate = await this.getRate(from, to, date);
    return amount * rate;
  }

  /**
   * Return the multiplier from `from` → `to` on `date`. Reads from the local cache first,
   * falls back to an external provider on miss and persists the result for future calls.
   * Throws when no rate can be obtained — callers must not persist entries with a bogus rate,
   * since that would silently corrupt balances forever.
   */
  public async getRate(from: Currency, to: Currency, date: Date): Promise<number> {
    if (from === to) {
      return 1;
    }
    const isoDate = date.toISOString().split('T')[0];
    const cached = await this.exchangeRateRepository.findOne({
      where: { date: isoDate, fromCurrency: from, toCurrency: to },
    });
    if (cached) {
      return Number(cached.rate);
    }

    // Cache miss. Many callers (e.g. the accounts list converting every balance) hit the same
    // pair at once — share a single fetch+persist so we don't fan out N HTTP calls.
    const key = `${isoDate}|${from}|${to}`;
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }
    const pending = this.fetchAndCache(from, to, date, isoDate).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, pending);
    return pending;
  }

  private async fetchAndCache(from: Currency, to: Currency, date: Date, isoDate: string): Promise<number> {
    const rate = await this.fetchRate(from, to, date);
    if (rate == null) {
      throw new ServiceUnavailableException(
        `Could not obtain FX rate ${from}->${to} on ${isoDate}. Retry, or supply an explicit fxRate on the entry.`,
      );
    }
    // ON CONFLICT DO NOTHING: a concurrent process (or the daily backfill) may have inserted
    // the same immutable rate already. No exception, no log noise.
    await this.exchangeRateRepository
      .createQueryBuilder()
      .insert()
      .values({ date: isoDate, fromCurrency: from, toCurrency: to, rate, source: 'frankfurter' })
      .orIgnore()
      .execute();
    return rate;
  }

  /**
   * Walk every ledger base currency and pre-populate the cache for every account currency
   * back `lookbackDays` days, forward-filling weekends/holidays from the most recent business
   * day. Idempotent — only inserts dates that aren't already cached. One HTTP call per base
   * currency thanks to frankfurter's timeseries endpoint.
   */
  public async backfillCache(lookbackDays = 365): Promise<BackfillResult> {
    const ledgers = await this.ledgerRepository.find();
    const accounts = await this.accountRepository.find();

    const baseCurrencies = new Set<Currency>(ledgers.map((l) => l.baseCurrency));
    const allCurrencies = new Set<Currency>([...accounts.map((a) => a.currency), ...baseCurrencies]);

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - lookbackDays);
    const startIso = start.toISOString().split('T')[0];
    const endIso = end.toISOString().split('T')[0];

    let rowsInserted = 0;
    let fromCurrencies = 0;

    for (const from of baseCurrencies) {
      const targets = [...allCurrencies].filter((c) => c !== from);
      if (targets.length === 0) {
        continue;
      }
      fromCurrencies += 1;

      let response: { rates: Record<string, Record<string, number>> };
      try {
        const url = `https://api.frankfurter.app/${startIso}..${endIso}?from=${from}&to=${targets.join(',')}`;
        const res = await axios.get<{ rates: Record<string, Record<string, number>> }>(url);
        response = res.data;
      } catch (err) {
        this.logger.warn(`Backfill: failed timeseries fetch from ${from}: ${(err as Error).message}`);
        continue;
      }

      const existing = await this.exchangeRateRepository.find({
        where: { fromCurrency: from, date: Between(startIso, endIso) },
      });
      const existingSet = new Set(existing.map((r) => `${r.date}|${r.toCurrency}`));

      const sortedBusinessDates = Object.keys(response.rates).sort();
      const toInsert: Partial<ExchangeRate>[] = [];

      for (const to of targets) {
        const series: { date: string; rate: number }[] = [];
        for (const d of sortedBusinessDates) {
          const r = response.rates[d]?.[to];
          if (typeof r === 'number') {
            series.push({ date: d, rate: r });
          }
        }
        if (series.length === 0) {
          continue;
        }

        let seriesIdx = 0;
        let lastRate: number | null = null;
        const cursor = new Date(start);
        while (cursor <= end) {
          const iso = cursor.toISOString().split('T')[0];
          while (seriesIdx < series.length && series[seriesIdx].date <= iso) {
            lastRate = series[seriesIdx].rate;
            seriesIdx += 1;
          }
          if (lastRate != null && !existingSet.has(`${iso}|${to}`)) {
            toInsert.push({ date: iso, fromCurrency: from, toCurrency: to, rate: lastRate, source: 'frankfurter' });
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      if (toInsert.length > 0) {
        await this.exchangeRateRepository.insert(toInsert);
        rowsInserted += toInsert.length;
      }
    }

    this.logger.log(`Backfill complete: ${rowsInserted} rates inserted across ${fromCurrencies} base currencies`);
    return { fromCurrencies, rowsInserted };
  }

  private async fetchRate(from: Currency, to: Currency, date: Date): Promise<number | null> {
    try {
      const isoDate = date.toISOString().split('T')[0];
      const result = await axios.get<{ rates: Record<string, number> }>(
        `https://api.frankfurter.app/${isoDate}?from=${from}&to=${to}`,
      );
      const rate = result.data.rates?.[to];
      return typeof rate === 'number' ? rate : null;
    } catch (err) {
      this.logger.warn(`Failed to fetch FX rate ${from}->${to}: ${(err as Error).message}`);
      return null;
    }
  }
}
