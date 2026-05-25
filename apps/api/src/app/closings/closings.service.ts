import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isAccountActive } from '../accounts/account-active';
import { Account, AccountType } from '../accounts/accounts.entity';
import { LedgersService } from '../ledgers/ledgers.service';
import { Currency } from '../shared/currency';
import { Context } from '../shared/types/context';
import { fiscalYearPeriod } from '../shared/date';
import { EntryDirection } from '../transactions/entry.entity';
import { EntryInput, TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../transactions/transactions.entity';
import { FiscalYear, FiscalYearState } from './fiscal-year.entity';

const EPSILON = 0.005;

/** Closing transaction description per UI language (cosmetic — the `closing` flag drives all logic). */
const CLOSING_DESCRIPTION: Record<string, (label: string) => string> = {
  en: (l) => `Year-end closing FY ${l}`,
  de: (l) => `Jahresabschluss GJ ${l}`,
  fr: (l) => `Clôture annuelle EX ${l}`,
  it: (l) => `Chiusura annuale ES ${l}`,
};

export interface ClosingEntryPreview {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  direction: EntryDirection;
  amount: number;
  currency: Currency;
}

export interface ClosingPreview {
  fiscalYearStartYear: number;
  /** Display label: "2025" for a calendar fiscal year, "2025/26" when it doesn't start in January. */
  label: string;
  /** Localized description to stamp on the closing transaction. */
  description: string;
  periodStart: string;
  periodEnd: string;
  baseCurrency: Currency;
  retainedEarningsAccountId: string;
  retainedEarningsAccountName: string;
  netResult: number;
  entries: ClosingEntryPreview[];
  /** Income/expense accounts skipped because they aren't in the ledger base currency. */
  skipped: { accountId: string; accountName: string; currency: Currency; balance: number }[];
  alreadyClosed: boolean;
}

export interface ClosableYear {
  fiscalYearStartYear: number;
  /** Display label: "2025" for a calendar fiscal year, "2025/26" when it doesn't start in January. */
  label: string;
  periodStart: string;
  periodEnd: string;
  /** A posted closing transaction already exists for this period (simple close or sealed workflow). */
  closed: boolean;
  /** Advanced-workflow state, when a FiscalYear row exists; null for never-touched / simple closes. */
  state: FiscalYearState | null;
  /** FiscalYear row id (for seal/cancel in the advanced workflow); null when no row exists yet. */
  fiscalYearId: string | null;
  /** The year the UI should pre-select: newest year still needing action. */
  isDefault: boolean;
}

@Injectable()
export class ClosingsService {
  constructor(
    private ledgersService: LedgersService,
    private transactionsService: TransactionsService,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(FiscalYear)
    private fiscalYearsRepository: Repository<FiscalYear>,
    private dataSource: DataSource,
  ) {}

  /**
   * Completed fiscal years the user can close, newest first — from the earliest year with posted
   * activity up to the last fully-elapsed fiscal year (never the in-progress current year), honouring
   * the ledger's fiscal-year start month. `isDefault` marks the newest year still needing action.
   */
  async listClosableYears(context: Context): Promise<ClosableYear[]> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const currentStartYear = this.ledgersService.fiscalYearBounds(ledger, new Date()).start.getUTCFullYear();
    const lastCompletedStartYear = currentStartYear - 1;

    const [activity] = (await this.dataSource.query(
      `SELECT MIN(t.transaction_date)::text AS min FROM transactions t WHERE t.ledger_id = $1 AND t.posted_at IS NOT NULL`,
      [ledger.id],
    )) as { min: string | null }[];
    let earliestStartYear = lastCompletedStartYear;
    if (activity?.min) {
      earliestStartYear = this.ledgersService.fiscalYearBounds(ledger, new Date(activity.min)).start.getUTCFullYear();
    }
    const MAX_YEARS = 12;
    const fromYear = Math.max(earliestStartYear, lastCompletedStartYear - (MAX_YEARS - 1));

    const fyRows = await this.fiscalYearsRepository.find({ where: { ledgerId: ledger.id } });
    const fyByYear = new Map(fyRows.map((r) => [r.startYear, r]));

    const candidates: ClosableYear[] = [];
    for (let year = lastCompletedStartYear; year >= fromYear; year--) {
      const period = fiscalYearPeriod(year, ledger.fiscalYearStartMonth);
      const fy = fyByYear.get(year) ?? null;
      candidates.push({
        fiscalYearStartYear: year,
        label: this.yearLabel(year, ledger.fiscalYearStartMonth),
        periodStart: period.start,
        periodEnd: period.end,
        closed: await this.fiscalYearIsClosed(ledger.id, period.start, period.endExclusive),
        state: fy?.state ?? null,
        fiscalYearId: fy?.id ?? null,
        isDefault: false,
      });
    }

    // Pre-select the newest year still needing action; fall back to the newest overall.
    const actionableIdx = candidates.findIndex((c) => !c.closed && c.state !== FiscalYearState.CLOSED);
    if (candidates.length > 0) {
      candidates[actionableIdx === -1 ? 0 : actionableIdx].isDefault = true;
    }
    return candidates;
  }

  private yearLabel(startYear: number, startMonth: number): string {
    if (startMonth === 1) {
      return String(startYear);
    }
    return `${startYear}/${((startYear + 1) % 100).toString().padStart(2, '0')}`;
  }

  /** Inspect what `closeFiscalYear` would do without persisting anything. */
  async preview(context: Context, fiscalYearStartYear: number): Promise<ClosingPreview> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    if (!ledger.retainedEarningsAccountId) {
      throw new BadRequestException('A Retained Earnings account must be set in Ledger settings before closing.');
    }
    const retainedEarnings = await this.accountsRepository.findOneBy({
      id: ledger.retainedEarningsAccountId,
      ledgerId: ledger.id,
    });
    if (!retainedEarnings) {
      throw new BadRequestException('Configured Retained Earnings account no longer exists. Pick a new one in Ledger settings.');
    }

    const period = fiscalYearPeriod(fiscalYearStartYear, ledger.fiscalYearStartMonth);

    // Tally per-account income/expense activity inside the period.
    const rows = await this.dataSource.query(
      `SELECT a.id AS "accountId", a.name AS "accountName", a.type AS "type", a.currency AS "currency",
              COALESCE(SUM(CASE WHEN e.direction = 'DEBIT' THEN e.amount ELSE 0 END), 0)::numeric AS "debitTotal",
              COALESCE(SUM(CASE WHEN e.direction = 'CREDIT' THEN e.amount ELSE 0 END), 0)::numeric AS "creditTotal"
         FROM accounts a
         JOIN entries e ON e.account_id = a.id
         JOIN transactions t ON t.id = e.transaction_id
        WHERE a.ledger_id = $1
          AND a.type IN ('INCOME', 'EXPENSE')
          AND t.posted_at IS NOT NULL
          AND t.transaction_date >= $2::date
          AND t.transaction_date < $3::date
        GROUP BY a.id, a.name, a.type, a.currency`,
      [ledger.id, period.start, period.endExclusive],
    );

    const entries: ClosingEntryPreview[] = [];
    const skipped: ClosingPreview['skipped'] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    let netResult = 0;

    for (const row of rows as {
      accountId: string;
      accountName: string;
      type: AccountType;
      currency: Currency;
      debitTotal: string;
      creditTotal: string;
    }[]) {
      const debit = parseFloat(row.debitTotal);
      const credit = parseFloat(row.creditTotal);
      const balance =
        row.type === AccountType.INCOME ? credit - debit : debit - credit;
      if (Math.abs(balance) < EPSILON) {
        continue;
      }
      if (row.currency !== ledger.baseCurrency) {
        skipped.push({
          accountId: row.accountId,
          accountName: row.accountName,
          currency: row.currency,
          balance,
        });
        continue;
      }
      // Income (credit-positive): debit to zero out. Expense (debit-positive): credit to zero out.
      const direction =
        row.type === AccountType.INCOME
          ? balance > 0
            ? EntryDirection.DEBIT
            : EntryDirection.CREDIT
          : balance > 0
            ? EntryDirection.CREDIT
            : EntryDirection.DEBIT;
      const amount = Math.abs(balance);
      entries.push({
        accountId: row.accountId,
        accountName: row.accountName,
        accountType: row.type,
        direction,
        amount,
        currency: row.currency,
      });
      if (direction === EntryDirection.DEBIT) {
        totalDebit += amount;
        netResult += row.type === AccountType.INCOME ? amount : -amount;
      } else {
        totalCredit += amount;
        netResult += row.type === AccountType.INCOME ? -amount : amount;
      }
    }

    // Add the balancing retained-earnings entry so the closing transaction zeroes out.
    const netDebit = totalDebit - totalCredit;
    if (Math.abs(netDebit) >= EPSILON) {
      entries.push({
        accountId: retainedEarnings.id,
        accountName: retainedEarnings.name,
        accountType: AccountType.EQUITY,
        direction: netDebit > 0 ? EntryDirection.CREDIT : EntryDirection.DEBIT,
        amount: Math.abs(netDebit),
        currency: ledger.baseCurrency,
      });
    }

    const label = this.yearLabel(fiscalYearStartYear, ledger.fiscalYearStartMonth);
    const describe = CLOSING_DESCRIPTION[context.user.language] ?? CLOSING_DESCRIPTION.en;
    return {
      fiscalYearStartYear,
      label,
      description: describe(label),
      periodStart: period.start,
      periodEnd: period.end,
      baseCurrency: ledger.baseCurrency,
      retainedEarningsAccountId: retainedEarnings.id,
      retainedEarningsAccountName: retainedEarnings.name,
      netResult,
      entries,
      skipped,
      alreadyClosed: await this.fiscalYearIsClosed(ledger.id, period.start, period.endExclusive),
    };
  }

  /** Materialise the soft close as one posted transaction. Idempotent: refuses if already closed. */
  async closeFiscalYear(context: Context, fiscalYearStartYear: number) {
    const preview = await this.preview(context, fiscalYearStartYear);
    if (preview.alreadyClosed) {
      throw new ConflictException(`Fiscal year ${fiscalYearStartYear} has already been closed.`);
    }
    if (preview.entries.length < 2) {
      throw new BadRequestException('Nothing to close — no income or expense activity in this fiscal year.');
    }

    // Retained earnings account must be active on the period-end date or the transaction will reject.
    const retainedEarnings = await this.accountsRepository.findOneByOrFail({ id: preview.retainedEarningsAccountId });
    if (!isAccountActive(retainedEarnings, preview.periodEnd)) {
      throw new BadRequestException('Retained Earnings account is not active on the closing date.');
    }

    const entries: EntryInput[] = preview.entries.map((e) => ({
      accountId: e.accountId,
      direction: e.direction,
      amount: e.amount,
      currency: e.currency,
      fxRate: 1,
    }));

    return this.transactionsService.createTransaction(context, {
      description: preview.description,
      transactionDate: preview.periodEnd,
      entries,
      post: true,
      closing: true,
    });
  }

  /**
   * A fiscal year counts as closed when a posted closing transaction sits in its period AND has not
   * been reversed — so reversing the closing transaction re-opens the year for re-closing. Identified
   * by the structural `closing` flag, not the (localized) description.
   */
  private async fiscalYearIsClosed(ledgerId: string, periodStart: string, periodEndExclusive: string): Promise<boolean> {
    const existing = await this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.ledger_id = :ledgerId', { ledgerId })
      .andWhere('t.transaction_date >= :start', { start: periodStart })
      .andWhere('t.transaction_date < :end', { end: periodEndExclusive })
      .andWhere('t.closing = true')
      .andWhere('t.posted_at IS NOT NULL')
      .andWhere(`NOT EXISTS (SELECT 1 FROM transactions r WHERE r.reverses_transaction_id = t.id)`)
      .getCount();
    return existing > 0;
  }
}
