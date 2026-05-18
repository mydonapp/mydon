import { Injectable } from '@nestjs/common';
import { AccountType } from '../accounts/accounts.entity';
import { AccountsService } from '../accounts/accounts.service';
import { LedgersService } from '../ledgers/ledgers.service';
import { Context } from '../shared/types/context';
import { buildBalanceSheetPdf, buildTrialBalancePdf } from './reports.pdf';

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
   * Assets = Liabilities + Equity as of the period end. The period's net result
   * (income − expense) is folded into equity so the statement balances before any
   * closing entries are booked.
   */
  async getBalanceSheet(context: Context, filter: { from?: Date; to?: Date }) {
    const { baseCurrency, grouped } = await this.load(context, filter);

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
    const totalEquity = equity.total + netResult;
    const totalLiabilitiesAndEquity = liabilities.total + totalEquity;

    return {
      baseCurrency,
      assets,
      liabilities,
      equity,
      netResult,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanced: Math.abs(assets.total - totalLiabilitiesAndEquity) <= EPSILON,
    };
  }
}
