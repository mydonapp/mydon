import { Injectable } from '@nestjs/common';
import { AccountType } from '../accounts/accounts.entity';
import { AccountsService } from '../accounts/accounts.service';
import { LedgersService } from '../ledgers/ledgers.service';
import { Context } from '../shared/types/context';
import { buildBalanceSheetPdf, buildIncomeStatementPdf, buildTrialBalancePdf } from './reports.pdf';

interface GroupedAccount {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  currency: string;
  balanceMainCurrency: number;
}

const DEBIT_NORMAL = new Set<AccountType>([AccountType.ASSETS, AccountType.EXPENSE]);
const EPSILON = 0.01;

@Injectable()
export class ReportsService {
  constructor(
    private accountsService: AccountsService,
    private ledgersService: LedgersService,
  ) {}

  private async load(context: Context, filter: { from?: Date; to?: Date }) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const grouped = await this.accountsService.findAllGroupedByAccountType(context, { filter });
    return { ledger, baseCurrency: ledger.baseCurrency, grouped };
  }

  /**
   * Virtually rolls un-closed prior-period income/expense into retained earnings. Returns 0
   * when no `from` is supplied (the period starts at the beginning of time, so nothing is
   * "prior") or when no explicit period is requested at all.
   */
  private async priorPeriodNetResult(ledgerId: string, filter: { from?: Date; to?: Date }): Promise<number> {
    if (!filter.from) {
      return 0;
    }
    return this.accountsService.getPriorPeriodNetResult(ledgerId, filter.from);
  }

  private periodLabel(filter: { from?: Date; to?: Date }): string {
    if (!filter.from && !filter.to) {
      return 'All time';
    }
    const iso = (d?: Date) => (d ? new Date(d).toISOString().slice(0, 10) : '…');
    return `${iso(filter.from)} — ${iso(filter.to)}`;
  }

  async buildTrialBalancePdf(context: Context, filter: { from?: Date; to?: Date }): Promise<Buffer> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const data = await this.getTrialBalance(context, filter);
    return buildTrialBalancePdf(
      { ledgerName: ledger.name, baseCurrency: data.baseCurrency, periodLabel: this.periodLabel(filter) },
      data,
    );
  }

  async buildBalanceSheetPdf(context: Context, filter: { from?: Date; to?: Date }): Promise<Buffer> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const data = await this.getBalanceSheet(context, filter);
    return buildBalanceSheetPdf(
      { ledgerName: ledger.name, baseCurrency: data.baseCurrency, periodLabel: this.periodLabel(filter) },
      data,
    );
  }

  async buildIncomeStatementPdf(context: Context, filter: { from?: Date; to?: Date }): Promise<Buffer> {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const data = await this.getIncomeStatement(context, filter);
    return buildIncomeStatementPdf(
      { ledgerName: ledger.name, baseCurrency: data.baseCurrency, periodLabel: this.periodLabel(filter) },
      data,
    );
  }

  /**
   * Every account's net balance (in the ledger base currency) placed in the debit or
   * credit column by its normal-balance side. A sound double-entry ledger has equal
   * column totals; `difference` surfaces any residual (typically FX rounding).
   */
  async getTrialBalance(context: Context, filter: { from?: Date; to?: Date }) {
    const { baseCurrency, grouped } = await this.load(context, filter);
    const all: GroupedAccount[] = [
      ...grouped.assets.accounts,
      ...grouped.liabilities.accounts,
      ...grouped.equity.accounts,
      ...grouped.income.accounts,
      ...grouped.expense.accounts,
    ];

    const rows = all
      .map((a) => {
        const amount = a.balanceMainCurrency;
        const debitNormal = DEBIT_NORMAL.has(a.type);
        let debit = 0;
        let credit = 0;
        if (debitNormal) {
          if (amount >= 0) {
            debit = amount;
          } else {
            credit = -amount;
          }
        } else if (amount >= 0) {
          credit = amount;
        } else {
          debit = -amount;
        }
        return { id: a.id, code: a.code, name: a.name, type: a.type, debit, credit };
      })
      .filter((r) => Math.abs(r.debit) > EPSILON || Math.abs(r.credit) > EPSILON);

    const debitTotal = rows.reduce((s, r) => s + r.debit, 0);
    const creditTotal = rows.reduce((s, r) => s + r.credit, 0);
    const difference = debitTotal - creditTotal;

    return {
      baseCurrency,
      rows,
      debitTotal,
      creditTotal,
      difference,
      balanced: Math.abs(difference) <= EPSILON,
    };
  }

  /**
   * Income Statement (P&L) for the period with a year-over-year comparison: income and expense
   * accounts with their current- and prior-year balances (merged by account id), plus the net
   * result for each period. The prior period is the same date range shifted back one year.
   */
  async getIncomeStatement(context: Context, filter: { from?: Date; to?: Date }) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    // Exclude year-end closing entries so a closed year still reports the income/expense it earned
    // (the closing zeroes those accounts into retained earnings, which would otherwise read as 0).
    const current = await this.accountsService.findAllGroupedByAccountType(context, {
      filter,
      excludeClosingEntries: true,
    });

    const previousFilter =
      filter.from || filter.to
        ? { from: this.shiftBackOneYear(filter.from), to: this.shiftBackOneYear(filter.to) }
        : null;
    const previous = previousFilter
      ? await this.accountsService.findAllGroupedByAccountType(context, {
          filter: previousFilter,
          excludeClosingEntries: true,
        })
      : null;

    const currentYear = filter.from ? new Date(filter.from).getUTCFullYear() : null;

    return {
      baseCurrency: ledger.baseCurrency,
      currentLabel: currentYear !== null ? String(currentYear) : 'All time',
      previousLabel: currentYear !== null ? String(currentYear - 1) : null,
      income: {
        rows: this.mergeComparisonRows(current.income.accounts, previous?.income.accounts ?? []),
        currentTotal: current.income.total,
        previousTotal: previous?.income.total ?? 0,
      },
      expense: {
        rows: this.mergeComparisonRows(current.expense.accounts, previous?.expense.accounts ?? []),
        currentTotal: current.expense.total,
        previousTotal: previous?.expense.total ?? 0,
      },
      netResult: {
        current: current.income.total - current.expense.total,
        previous: (previous?.income.total ?? 0) - (previous?.expense.total ?? 0),
      },
    };
  }

  /**
   * Income statement broken out by month (Jan–Dec) for `year`: each income/expense account's monthly
   * base-currency actual, with per-month section totals and a monthly net result. Single-month columns
   * reconcile with {@link getIncomeStatement} for the same period (base-currency income/expense accounts).
   */
  async getIncomeStatementMonthly(context: Context, year: number) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const accounts = await this.accountsService.getMonthlyIncomeExpenseActuals(ledger.id, year);

    const section = (rows: { id: string; code: string; name: string; type: AccountType; months: number[] }[]) => {
      const monthlyTotals = new Array<number>(12).fill(0);
      for (const r of rows) {
        for (let i = 0; i < 12; i++) {
          monthlyTotals[i] += r.months[i];
        }
      }
      return {
        rows: rows.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          months: r.months,
          total: Math.round(r.months.reduce((s, m) => s + m, 0) * 100) / 100,
        })),
        monthlyTotals: monthlyTotals.map((v) => Math.round(v * 100) / 100),
        total: Math.round(monthlyTotals.reduce((s, v) => s + v, 0) * 100) / 100,
      };
    };

    const income = section(accounts.filter((a) => a.type === AccountType.INCOME));
    const expense = section(accounts.filter((a) => a.type === AccountType.EXPENSE));
    const netMonthly = income.monthlyTotals.map((v, i) => Math.round((v - expense.monthlyTotals[i]) * 100) / 100);

    return {
      baseCurrency: ledger.baseCurrency,
      year,
      income,
      expense,
      netMonthly,
      netTotal: Math.round((income.total - expense.total) * 100) / 100,
    };
  }

  private shiftBackOneYear(d?: Date): Date | undefined {
    if (!d) {
      return undefined;
    }
    const date = new Date(d);
    return new Date(Date.UTC(date.getUTCFullYear() - 1, date.getUTCMonth(), date.getUTCDate()));
  }

  /** Union income/expense accounts across the two periods into one row each (current + previous). */
  private mergeComparisonRows(current: GroupedAccount[], previous: GroupedAccount[]) {
    const map = new Map<string, { id: string; code: string; name: string; current: number; previous: number }>();
    for (const a of current) {
      map.set(a.id, { id: a.id, code: a.code, name: a.name, current: a.balanceMainCurrency, previous: 0 });
    }
    for (const a of previous) {
      const existing = map.get(a.id);
      if (existing) {
        existing.previous = a.balanceMainCurrency;
      } else {
        map.set(a.id, { id: a.id, code: a.code, name: a.name, current: 0, previous: a.balanceMainCurrency });
      }
    }
    return [...map.values()].sort((x, y) => {
      const xHas = x.code !== '';
      const yHas = y.code !== '';
      if (xHas && yHas) {
        return x.code.localeCompare(y.code, undefined, { numeric: true });
      }
      if (xHas) {
        return -1;
      }
      if (yHas) {
        return 1;
      }
      return x.name.localeCompare(y.name);
    });
  }

  /**
   * Assets = Liabilities + Equity as of the period end. The period's net result
   * (income − expense) is folded into equity, plus any un-closed prior-period
   * net result rolled in virtually as retained earnings (soft close), so the
   * statement balances even when the user never ran an explicit year-end close.
   */
  async getBalanceSheet(context: Context, filter: { from?: Date; to?: Date }) {
    const { ledger, baseCurrency, grouped } = await this.load(context, filter);

    const section = (accounts: GroupedAccount[], total: number) => ({
      accounts: accounts.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        currency: a.currency,
        amount: a.balanceMainCurrency,
      })),
      total,
    });

    const assets = section(grouped.assets.accounts, grouped.assets.total);
    const liabilities = section(grouped.liabilities.accounts, grouped.liabilities.total);
    const equity = section(grouped.equity.accounts, grouped.equity.total);
    const netResult = grouped.income.total - grouped.expense.total;
    const priorPeriodResult = await this.priorPeriodNetResult(ledger.id, filter);
    const totalEquity = equity.total + priorPeriodResult + netResult;
    const totalLiabilitiesAndEquity = liabilities.total + totalEquity;

    return {
      baseCurrency,
      assets,
      liabilities,
      equity,
      netResult,
      priorPeriodResult,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanced: Math.abs(assets.total - totalLiabilitiesAndEquity) <= EPSILON,
    };
  }
}
