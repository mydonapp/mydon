import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account, AccountType } from '../accounts/accounts.entity';
import { User } from '../auth/user.entity';
import { Category } from '../categories/categories.entity';
import { Context } from '../shared/types/context';
import { BudgetFrequency, BudgetItem } from './budget-item.entity';
import { Budget } from './budgets.entity';
import { BudgetItemDto } from './dtos/upsert-budget-items.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetsRepository: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemsRepository: Repository<BudgetItem>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    private dataSource: DataSource,
  ) {}

  async findAll(context: Context) {
    const budgets = await this.budgetsRepository.find({
      where: { user: { id: context.user.id } },
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
    const budget = await this.budgetsRepository.findOne({
      where: { id, user: { id: context.user.id } },
      relations: ['items', 'items.account', 'items.category'],
    });
    if (!budget) {
      throw new NotFoundException();
    }

    return {
      id: budget.id,
      name: budget.name,
      year: budget.year,
      items: budget.items.map((item) => ({
        id: item.id,
        type: item.category ? 'category' : 'account',
        categoryId: item.category?.id ?? null,
        categoryName: item.category?.name ?? null,
        accountId: item.account?.id ?? null,
        accountName: item.account?.name ?? null,
        amount: item.amount,
        frequency: item.frequency,
      })),
    };
  }

  async create(context: Context, name: string, year: number) {
    const budget = new Budget();
    budget.name = name;
    budget.year = year;
    budget.user = { id: context.user.id } as User;
    const saved = await this.budgetsRepository.save(budget);
    return { id: saved.id, name: saved.name, year: saved.year, itemCount: 0 };
  }

  async update(id: string, context: Context, data: { name?: string; year?: number }) {
    const budget = await this.budgetsRepository.findOne({
      where: { id, user: { id: context.user.id } },
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
    const budget = await this.budgetsRepository.findOne({
      where: { id, user: { id: context.user.id } },
    });
    if (!budget) {
      throw new NotFoundException();
    }
    await this.budgetsRepository.remove(budget);
  }

  async upsertItems(budgetId: string, context: Context, items: BudgetItemDto[]) {
    const budget = await this.budgetsRepository.findOne({
      where: { id: budgetId, user: { id: context.user.id } },
    });
    if (!budget) {
      throw new NotFoundException();
    }

    await this.budgetItemsRepository.delete({ budget: { id: budgetId } });

    const newItems = await Promise.all(
      items.map(async (dto) => {
        const item = new BudgetItem();
        item.budget = { id: budgetId } as Budget;
        item.amount = dto.amount;
        item.frequency = dto.frequency;
        item.account = dto.accountId ? ({ id: dto.accountId } as Account) : null;
        item.category = dto.categoryId ? ({ id: dto.categoryId } as Category) : null;
        return item;
      }),
    );

    await this.budgetItemsRepository.save(newItems);
    return this.findOne(budgetId, context);
  }

  async getProgress(budgetId: string, context: Context, year: number, month?: number) {
    const budget = await this.budgetsRepository.findOne({
      where: { id: budgetId, user: { id: context.user.id } },
      relations: ['items', 'items.account', 'items.category'],
    });
    if (!budget) {
      throw new NotFoundException();
    }

    const isMonthly = month !== undefined && month !== null;
    const now = new Date();
    const isCurrentYear = year === now.getFullYear();

    const from = isMonthly ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const to = isMonthly
      ? new Date(year, month, 0, 23, 59, 59, 999)
      : isCurrentYear
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        : new Date(year, 11, 31, 23, 59, 59, 999);

    const prevFrom = isMonthly
      ? month === 1
        ? new Date(year - 1, 11, 1)
        : new Date(year, month - 2, 1)
      : new Date(year - 1, 0, 1);
    const prevTo = isMonthly
      ? month === 1
        ? new Date(year - 1, 11, 31, 23, 59, 59)
        : new Date(year, month - 1, 0, 23, 59, 59)
      : new Date(year - 1, 11, 31, 23, 59, 59);

    const monthsElapsed = isCurrentYear ? now.getMonth() + 1 : year < now.getFullYear() ? 12 : 0;

    const progressItems = await Promise.all(
      budget.items.map(async (item) => {
        const monthlyBudget = item.frequency === BudgetFrequency.MONTHLY ? item.amount : item.amount / 12;
        const yearlyBudget = item.frequency === BudgetFrequency.YEARLY ? item.amount : item.amount * 12;
        const displayBudget = isMonthly ? monthlyBudget : yearlyBudget;

        let actual = 0;
        let prevActual = 0;
        let accountType: string | null = null;
        let accountBreakdown: { id: string; name: string; actual: number }[] = [];

        if (item.category) {
          const curr = await this.getCategoryActual(item.category.id, context.user.id, from, to);
          const prev = await this.getCategoryActual(item.category.id, context.user.id, prevFrom, prevTo);
          actual = curr.total;
          prevActual = prev.total;
          accountType = curr.accountType;
          accountBreakdown = curr.accounts;
        } else if (item.account) {
          actual = await this.getAccountActual(item.account, context.user.id, from, to);
          prevActual = await this.getAccountActual(item.account, context.user.id, prevFrom, prevTo);
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
          name: item.category?.name ?? item.account?.name ?? '',
          type: item.category ? 'category' : 'account',
          accountType,
          categoryId: item.category?.id ?? null,
          categoryName: item.category?.name ?? null,
          accountId: item.account?.id ?? null,
          accountName: item.account?.name ?? null,
          accountNumber: item.account?.accountNumber ?? null,
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

  private async getAccountActual(account: Account, userId: string, from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT
        COALESCE(SUM(CASE WHEN "creditAccountId" = $1 THEN "creditAmount" ELSE 0 END), 0)::numeric AS "creditBalance",
        COALESCE(SUM(CASE WHEN "debitAccountId" = $1 THEN "debitAmount" ELSE 0 END), 0)::numeric AS "debitBalance"
       FROM transactions
       WHERE "userId" = $2
         AND "transactionDate" BETWEEN $3::timestamptz AND $4::timestamptz
         AND ("creditAccountId" = $1 OR "debitAccountId" = $1)`,
      [account.id, userId, from.toISOString(), to.toISOString()],
    );

    const credit = parseFloat(rows[0]?.creditBalance ?? '0');
    const debit = parseFloat(rows[0]?.debitBalance ?? '0');
    const balance =
      account.type === AccountType.ASSETS || account.type === AccountType.EXPENSE ? credit - debit : debit - credit;
    return Math.max(0, balance);
  }

  private async getCategoryActual(
    categoryId: string,
    userId: string,
    from: Date,
    to: Date,
  ): Promise<{ total: number; accountType: string | null; accounts: { id: string; name: string; actual: number }[] }> {
    const rows = await this.dataSource.query(
      `SELECT
        a.id,
        a.name,
        a.type,
        COALESCE(SUM(CASE WHEN t."creditAccountId" = a.id THEN t."creditAmount" ELSE 0 END), 0)::numeric AS "creditBalance",
        COALESCE(SUM(CASE WHEN t."debitAccountId" = a.id THEN t."debitAmount" ELSE 0 END), 0)::numeric AS "debitBalance"
       FROM accounts a
       LEFT JOIN transactions t
         ON (t."creditAccountId" = a.id OR t."debitAccountId" = a.id)
         AND t."userId" = $2
         AND t."transactionDate" BETWEEN $3::timestamptz AND $4::timestamptz
       WHERE a."categoryId" = $1
         AND a."userId" = $2
       GROUP BY a.id, a.name, a.type`,
      [categoryId, userId, from.toISOString(), to.toISOString()],
    );

    const accounts = (
      rows as { id: string; name: string; type: AccountType; creditBalance: string; debitBalance: string }[]
    ).map((row) => {
      const credit = parseFloat(row.creditBalance);
      const debit = parseFloat(row.debitBalance);
      const balance =
        row.type === AccountType.ASSETS || row.type === AccountType.EXPENSE ? credit - debit : debit - credit;
      return { id: row.id, name: row.name, actual: Math.max(0, balance) };
    });

    const total = accounts.reduce((sum: number, a: { actual: number }) => sum + a.actual, 0);
    const accountType: string | null = rows[0]?.type ?? null;
    return { total, accountType, accounts };
  }
}
