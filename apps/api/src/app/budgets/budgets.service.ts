import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Account, AccountType } from '../accounts/accounts.entity';
import { LedgersService } from '../ledgers/ledgers.service';
import { toDateString } from '../shared/date';
import { Context } from '../shared/types/context';
import { BudgetFrequency } from './budget-frequency.enum';
import { BudgetItem } from './budget-item.entity';
import { BudgetSubItem } from './budget-sub-item.entity';
import { Budget } from './budgets.entity';
import { BudgetItemDto, BudgetSubItemDto } from './dtos/upsert-budget-items.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetsRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemsRepository: Repository<BudgetItem>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(AccountGroup)
    private accountGroupsRepository: Repository<AccountGroup>,

    private dataSource: DataSource,
    private ledgersService: LedgersService,
  ) {}

  async findAll(context: Context) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budgets = await this.budgetsRepository.find({
      where: { ledgerId: ledger.id },
      relations: ['items'],
      order: { year: 'DESC', name: 'ASC' },
    });

    return budgets.map((b) => ({
      id: b.id,
      name: b.name,
      year: b.year,
      itemCount: b.items.length,
    }));
  }

  async findOne(id: string, context: Context) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budget = await this.budgetsRepository.findOne({
      where: { id, ledgerId: ledger.id },
      relations: ['items', 'items.account', 'items.group', 'items.subItems'],
    });
    if (!budget) {
      throw new NotFoundException();
    }

    return {
      id: budget.id,
      name: budget.name,
      year: budget.year,
      items: [...budget.items].sort((a, b) => this.byChartOrder(a, b)).map((item) => ({
        id: item.id,
        type: item.group ? 'group' : 'account',
        groupId: item.group?.id ?? null,
        groupName: item.group?.name ?? null,
        accountId: item.account?.id ?? null,
        accountName: item.account?.name ?? null,
        amount: item.amount,
        frequency: item.frequency,
        subItems: [...(item.subItems ?? [])]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((sub) => ({ id: sub.id, name: sub.name, amount: sub.amount, frequency: sub.frequency })),
      })),
    };
  }

  async create(context: Context, name: string, year: number) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budget = new Budget();
    budget.name = name;
    budget.year = year;
    budget.ledgerId = ledger.id;
    const saved = await this.budgetsRepository.save(budget);
    return { id: saved.id, name: saved.name, year: saved.year, itemCount: 0 };
  }

  /** Deep-copy a budget — its items and their sub-items — into a new name/year. */
  async duplicate(id: string, context: Context, name: string, year: number) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const source = await this.budgetsRepository.findOne({
      where: { id, ledgerId: ledger.id },
      relations: ['items', 'items.account', 'items.group', 'items.subItems'],
    });
    if (!source) {
      throw new NotFoundException();
    }

    const budget = new Budget();
    budget.name = name;
    budget.year = year;
    budget.ledgerId = ledger.id;
    const saved = await this.budgetsRepository.save(budget);

    const items = source.items.map((src) => {
      const item = new BudgetItem();
      item.budget = { id: saved.id } as Budget;
      item.amount = src.amount;
      item.frequency = src.frequency;
      item.account = src.account ? ({ id: src.account.id } as Account) : null;
      item.group = src.group ? ({ id: src.group.id } as AccountGroup) : null;
      item.subItems = [...(src.subItems ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => {
          const sub = new BudgetSubItem();
          sub.name = s.name;
          sub.amount = s.amount;
          sub.frequency = s.frequency;
          sub.sortOrder = s.sortOrder;
          return sub;
        });
      return item;
    });
    if (items.length > 0) {
      await this.budgetItemsRepository.save(items);
    }

    return { id: saved.id, name: saved.name, year: saved.year, itemCount: items.length };
  }

  async update(id: string, context: Context, data: { name?: string; year?: number }) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budget = await this.budgetsRepository.findOne({
      where: { id, ledgerId: ledger.id },
    });
    if (!budget) {
      throw new NotFoundException();
    }

    if (data.name !== undefined) {
      budget.name = data.name;
    }
    if (data.year !== undefined) {
      budget.year = data.year;
    }
    await this.budgetsRepository.save(budget);
    return { id: budget.id, name: budget.name, year: budget.year };
  }

  async remove(id: string, context: Context) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budget = await this.budgetsRepository.findOne({
      where: { id, ledgerId: ledger.id },
    });
    if (!budget) {
      throw new NotFoundException();
    }
    await this.budgetsRepository.remove(budget);
  }

  async upsertItems(budgetId: string, context: Context, items: BudgetItemDto[]) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budget = await this.budgetsRepository.findOne({
      where: { id: budgetId, ledgerId: ledger.id },
    });
    if (!budget) {
      throw new NotFoundException();
    }

    await this.assertReferencesInLedger(ledger.id, items);

    await this.budgetItemsRepository.delete({ budget: { id: budgetId } });

    const newItems = items.map((dto) => {
      const item = new BudgetItem();
      item.budget = { id: budgetId } as Budget;
      item.frequency = dto.frequency;
      item.account = dto.accountId ? ({ id: dto.accountId } as Account) : null;
      item.group = dto.groupId ? ({ id: dto.groupId } as AccountGroup) : null;

      const subItems = dto.subItems ?? [];
      if (subItems.length > 0) {
        // Sub-items drive the amount: store the normalized sum so getProgress stays untouched.
        item.amount = this.computeAmountFromSubItems(dto.frequency, subItems);
        item.subItems = subItems.map((sub, index) => {
          const subItem = new BudgetSubItem();
          subItem.name = sub.name;
          subItem.amount = sub.amount;
          subItem.frequency = sub.frequency;
          subItem.sortOrder = index;
          return subItem;
        });
      } else {
        item.amount = dto.amount;
        item.subItems = [];
      }
      return item;
    });

    await this.budgetItemsRepository.save(newItems);
    return this.findOne(budgetId, context);
  }

  async getProgress(budgetId: string, context: Context, year: number, month?: number) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const budget = await this.budgetsRepository.findOne({
      where: { id: budgetId, ledgerId: ledger.id },
      relations: ['items', 'items.account', 'items.group'],
    });
    if (!budget) {
      throw new NotFoundException();
    }

    const isMonthly = month !== undefined && month !== null;
    const now = new Date();
    const isCurrentYear = year === now.getUTCFullYear();

    // Period bounds are built in UTC so toDateString (which formats by the UTC day) yields the intended
    // calendar dates. Local Date constructors here shift across timezones and would pull the previous
    // period's last day into the range — inflating the monthly actuals.
    const from = isMonthly ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1));
    const to = isMonthly
      ? new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
      : isCurrentYear
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
        : new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const prevFrom = isMonthly
      ? month === 1
        ? new Date(Date.UTC(year - 1, 11, 1))
        : new Date(Date.UTC(year, month - 2, 1))
      : new Date(Date.UTC(year - 1, 0, 1));
    const prevTo = isMonthly
      ? month === 1
        ? new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59))
        : new Date(Date.UTC(year, month - 1, 0, 23, 59, 59))
      : new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59));

    const monthsElapsed = isCurrentYear ? now.getUTCMonth() + 1 : year < now.getUTCFullYear() ? 12 : 0;

    const progressItems = await Promise.all(
      [...budget.items].sort((a, b) => this.byChartOrder(a, b)).map(async (item) => {
        const monthlyBudget = item.frequency === BudgetFrequency.MONTHLY ? item.amount : item.amount / 12;
        const yearlyBudget = item.frequency === BudgetFrequency.YEARLY ? item.amount : item.amount * 12;
        const displayBudget = isMonthly ? monthlyBudget : yearlyBudget;

        let actual = 0;
        let prevActual = 0;
        let accountType: string | null = null;
        let accountBreakdown: { id: string; name: string; actual: number }[] = [];

        if (item.group) {
          const curr = await this.getGroupActual(item.group.id, ledger.id, from, to);
          const prev = await this.getGroupActual(item.group.id, ledger.id, prevFrom, prevTo);
          actual = curr.total;
          prevActual = prev.total;
          accountType = curr.accountType;
          accountBreakdown = curr.accounts;
        } else if (item.account) {
          actual = await this.getAccountActual(item.account, ledger.id, from, to);
          prevActual = await this.getAccountActual(item.account, ledger.id, prevFrom, prevTo);
          accountType = item.account.type;
        }

        const percentage = displayBudget > 0 ? Math.round((actual / displayBudget) * 1000) / 10 : 0;
        const monthOverMonthChange =
          prevActual > 0 ? Math.round(((actual - prevActual) / prevActual) * 1000) / 10 : null;

        let projectedYearly: number | null = null;
        if (!isMonthly && monthsElapsed > 0) {
          projectedYearly = Math.round((actual / monthsElapsed) * 12 * 100) / 100;
        }

        let recommendation: string | null = null;
        if (projectedYearly !== null && projectedYearly > yearlyBudget * 1.1) {
          recommendation = 'on_pace_to_exceed';
        } else if (isMonthly && percentage > 100) {
          recommendation = 'over_budget';
        }

        return {
          id: item.id,
          name: item.group?.name ?? item.account?.name ?? '',
          type: item.group ? 'group' : 'account',
          accountType,
          groupId: item.group?.id ?? null,
          groupName: item.group?.name ?? null,
          accountId: item.account?.id ?? null,
          accountName: item.account?.name ?? null,
          accountCode: item.account?.code ?? null,
          frequency: item.frequency,
          amount: item.amount,
          monthlyBudget: Math.round(monthlyBudget * 100) / 100,
          yearlyBudget: Math.round(yearlyBudget * 100) / 100,
          displayBudget: Math.round(displayBudget * 100) / 100,
          actual: Math.round(actual * 100) / 100,
          percentage,
          prevActual: Math.round(prevActual * 100) / 100,
          monthOverMonthChange,
          projectedYearly,
          recommendation,
          accounts: accountBreakdown,
        };
      }),
    );

    return {
      viewType: isMonthly ? 'monthly' : 'yearly',
      year,
      month: month ?? null,
      monthsElapsed,
      items: progressItems,
    };
  }

  private computeAmountFromSubItems(lineFrequency: BudgetFrequency, subItems: BudgetSubItemDto[]): number {
    const sum = subItems.reduce((acc, sub) => {
      const monthly = sub.frequency === BudgetFrequency.MONTHLY ? sub.amount : sub.amount / 12;
      const contribution = lineFrequency === BudgetFrequency.MONTHLY ? monthly : monthly * 12;
      return acc + contribution;
    }, 0);
    return Math.round(sum * 100) / 100;
  }

  /** Chart-of-accounts order by the item's account (or group) code: coded first numerically,
   *  uncoded last by name (mirrors AccountsService.byCode). */
  private byChartOrder(a: BudgetItem, b: BudgetItem): number {
    const aCode = a.account?.code ?? a.group?.code ?? '';
    const bCode = b.account?.code ?? b.group?.code ?? '';
    if (aCode !== '' && bCode !== '') {
      return aCode.localeCompare(bCode, undefined, { numeric: true });
    }
    if (aCode !== '') {
      return -1;
    }
    if (bCode !== '') {
      return 1;
    }
    const aName = a.account?.name ?? a.group?.name ?? '';
    const bName = b.account?.name ?? b.group?.name ?? '';
    return aName.localeCompare(bName);
  }

  /**
   * Reject budget items that reference an account or group outside the caller's ledger.
   * Without this, a crafted `accountId` would let a user read another tenant's balances
   * through the progress endpoint.
   */
  private async assertReferencesInLedger(ledgerId: string, items: BudgetItemDto[]): Promise<void> {
    const accountIds = [...new Set(items.map((i) => i.accountId).filter((id): id is string => !!id))];
    if (accountIds.length > 0) {
      const found = await this.accountsRepository.count({
        where: { id: In(accountIds), ledgerId },
      });
      if (found !== accountIds.length) {
        throw new BadRequestException('One or more accounts are not in your ledger');
      }
    }

    const groupIds = [...new Set(items.map((i) => i.groupId).filter((id): id is string => !!id))];
    if (groupIds.length > 0) {
      const found = await this.accountGroupsRepository.count({
        where: { id: In(groupIds), ledgerId },
      });
      if (found !== groupIds.length) {
        throw new BadRequestException('One or more account groups are not in your ledger');
      }
    }
  }

  private async getAccountActual(account: Account, ledgerId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT
        COALESCE(SUM(CASE WHEN e.direction = 'CREDIT' THEN e.amount ELSE 0 END), 0)::numeric AS "creditBalance",
        COALESCE(SUM(CASE WHEN e.direction = 'DEBIT'  THEN e.amount ELSE 0 END), 0)::numeric AS "debitBalance"
       FROM entries e
       JOIN transactions t ON t.id = e.transaction_id
       WHERE e.account_id = $1
         AND t.ledger_id = $4
         AND t.posted_at IS NOT NULL
         AND t.transaction_date BETWEEN $2::date AND $3::date`,
      [account.id, toDateString(from), toDateString(to), ledgerId],
    );

    const credit = parseFloat(rows[0]?.creditBalance ?? '0');
    const debit = parseFloat(rows[0]?.debitBalance ?? '0');
    // Normal-balance direction by type: ASSETS/EXPENSE are debit-positive, others credit-positive.
    const balance =
      account.type === AccountType.ASSETS || account.type === AccountType.EXPENSE ? debit - credit : credit - debit;
    return Math.max(0, balance);
  }

  private async getGroupActual(
    groupId: string,
    ledgerId: string,
    from: Date,
    to: Date,
  ): Promise<{ total: number; accountType: string | null; accounts: { id: string; name: string; actual: number }[] }> {
    // Note: keep accounts even when they have no in-range entries (LEFT JOIN preserves the row),
    // but filter entries by the transaction's posted state + date range inside the CASE — the
    // ON-clause filter alone wouldn't exclude rows in a LEFT JOIN, only null out `t`.
    const rows = await this.dataSource.query(
      `SELECT
        a.id,
        a.name,
        a.type,
        COALESCE(SUM(
          CASE WHEN e.direction = 'CREDIT'
                AND t.posted_at IS NOT NULL
                AND t.transaction_date BETWEEN $3::date AND $4::date
               THEN e.amount ELSE 0 END
        ), 0)::numeric AS "creditBalance",
        COALESCE(SUM(
          CASE WHEN e.direction = 'DEBIT'
                AND t.posted_at IS NOT NULL
                AND t.transaction_date BETWEEN $3::date AND $4::date
               THEN e.amount ELSE 0 END
        ), 0)::numeric AS "debitBalance"
       FROM accounts a
       LEFT JOIN entries e ON e.account_id = a.id
       LEFT JOIN transactions t ON t.id = e.transaction_id
       WHERE a."group_id" = $1
         AND a."ledger_id" = $2
       GROUP BY a.id, a.name, a.type`,
      [groupId, ledgerId, toDateString(from), toDateString(to)],
    );

    const accounts = (
      rows as { id: string; name: string; type: AccountType; creditBalance: string; debitBalance: string }[]
    ).map((row) => {
      const credit = parseFloat(row.creditBalance);
      const debit = parseFloat(row.debitBalance);
      const balance =
        row.type === AccountType.ASSETS || row.type === AccountType.EXPENSE ? debit - credit : credit - debit;
      return { id: row.id, name: row.name, actual: Math.max(0, balance) };
    });

    const total = accounts.reduce((sum: number, a: { actual: number }) => sum + a.actual, 0);
    const accountType: string | null = rows[0]?.type ?? null;
    return { total, accountType, accounts };
  }
}
