import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { Ledger } from '../ledgers/ledger.entity';
import { LedgersService } from '../ledgers/ledgers.service';
import { toDateString } from '../shared/date';
import { ForexService } from '../shared/forex/forex.service';
import { Context } from '../shared/types/context';
import { isAccountActive } from './account-active';
import { Account, AccountType, Currency } from './accounts.entity';

interface AccountWithBalance extends Account {
  debitTotal: number;
  creditTotal: number;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(AccountGroup)
    private accountGroupsRepository: Repository<AccountGroup>,
    @InjectRepository(Ledger)
    private ledgersRepository: Repository<Ledger>,
    private forexService: ForexService,
    private ledgersService: LedgersService,
    private dataSource: DataSource,
  ) {}

  /**
   * An account referenced by a ledger setting (currently just retained earnings) is
   * "in use" and may not be deactivated. Changing the ledger reference releases the lock.
   */
  private async assertNotReferencedByLedger(accountId: string, ledgerId: string): Promise<void> {
    const ledger = await this.ledgersRepository.findOneBy({ id: ledgerId });
    if (ledger?.retainedEarningsAccountId === accountId) {
      throw new BadRequestException(
        'This account is set as the ledger Retained Earnings account. Change the Retained Earnings account in Ledger settings first.',
      );
    }
  }

  /** Reject a group reference that belongs to another ledger (cross-tenant FK). */
  private async assertGroupInLedger(groupId: string, ledgerId: string): Promise<void> {
    const exists = await this.accountGroupsRepository.count({ where: { id: groupId, ledgerId } });
    if (exists === 0) {
      throw new NotFoundException('Account group not found in this ledger');
    }
  }

  async findAllSimple(context: Context) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const accounts = await this.accountsRepository.find({
      where: { ledgerId: ledger.id },
      relations: ['group'],
    });

    accounts.sort((a, b) => this.byCode(a, b));

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      description: account.description,
      type: account.type,
      currency: account.currency,
      isActive: isAccountActive(account),
      activeFrom: account.activeFrom,
      activeUntil: account.activeUntil,
      retirementAccount: account.retirementAccount,
      code: account.code,
      groupId: account.group?.id ?? null,
      groupName: account.group?.name ?? null,
    }));
  }

  /**
   * Pulls per-account debit and credit totals from the `entries` table within an
   * optional date range. Includes only posted (non-draft) transactions.
   */
  private async fetchBalancesByLedger(
    ledgerId: string,
    options?: { filter?: { from?: Date; to?: Date }; restrictDateForTypes?: AccountType[]; excludeClosingEntries?: boolean },
  ): Promise<Map<string, { debit: number; credit: number }>> {
    const from = toDateString(options?.filter?.from ?? new Date('1970-01-01'));
    const to = toDateString(options?.filter?.to ?? new Date('2100-12-31'));
    const restrictedTypes = options?.restrictDateForTypes ?? [];
    const excludeClosing = options?.excludeClosingEntries ?? false;

    // For EXPENSE / INCOME accounts the period applies; for balance-sheet accounts (assets/liabilities/equity),
    // sum the entries up to the period end so balances reflect everything through `to`.
    // `excludeClosing` drops year-end closing entries (and their reversals) — used by the income statement so a
    // closed year still shows the revenue/expense it earned rather than the zeroed-out post-close balances.
    const rows = await this.dataSource.query(
      `SELECT
         a.id AS "accountId",
         COALESCE(SUM(CASE WHEN e.direction = 'DEBIT' THEN e.amount ELSE 0 END), 0)::numeric AS "debitTotal",
         COALESCE(SUM(CASE WHEN e.direction = 'CREDIT' THEN e.amount ELSE 0 END), 0)::numeric AS "creditTotal"
       FROM accounts a
       LEFT JOIN entries e ON e.account_id = a.id
       LEFT JOIN transactions t ON t.id = e.transaction_id
       WHERE a.ledger_id = $1
         AND (e.id IS NULL OR (
           t.posted_at IS NOT NULL
           AND ($5 = false OR (NOT t.closing AND NOT EXISTS (SELECT 1 FROM transactions c WHERE c.id = t.reverses_transaction_id AND c.closing = true)))
           AND (
             a.type::text = ANY($2::text[]) AND t.transaction_date BETWEEN $3::date AND $4::date
             OR NOT (a.type::text = ANY($2::text[]))
             AND t.transaction_date <= $4::date
           )
         ))
       GROUP BY a.id`,
      [ledgerId, restrictedTypes, from, to, excludeClosing],
    );
    const map = new Map<string, { debit: number; credit: number }>();
    for (const row of rows as { accountId: string; debitTotal: string; creditTotal: string }[]) {
      map.set(row.accountId, { debit: parseFloat(row.debitTotal), credit: parseFloat(row.creditTotal) });
    }
    return map;
  }

  /**
   * Chart-of-accounts order: coded accounts first, sorted numerically by code
   * (so "100" < "1000" < "1100"); uncoded accounts last, sorted by name.
   */
  private byCode(a: { code: string; name: string }, b: { code: string; name: string }): number {
    const aHas = a.code !== '';
    const bHas = b.code !== '';
    if (aHas && bHas) {
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    }
    if (aHas) {
      return -1;
    }
    if (bHas) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  }

  private computeBalance(type: AccountType, debit: number, credit: number): number {
    // Normal balance: ASSETS/EXPENSE are debit-positive; LIABILITIES/EQUITY/INCOME are credit-positive.
    if (type === AccountType.ASSETS || type === AccountType.EXPENSE) {
      return debit - credit;
    }
    return credit - debit;
  }

  /**
   * Net result (income − expense, in base currency) of every posted entry strictly before
   * `beforeDate`. Used by reports to virtually roll un-closed prior-period income/expense
   * into retained earnings — a "soft close" that keeps the balance sheet balanced even when
   * the user never ran an explicit year-end close.
   */
  async getPriorPeriodNetResult(ledgerId: string, beforeDate: Date | string): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT a.type AS "type",
              e.direction AS "direction",
              COALESCE(SUM(e.base_amount), 0)::numeric AS "amount"
         FROM entries e
         JOIN accounts a ON a.id = e.account_id
         JOIN transactions t ON t.id = e.transaction_id
        WHERE a.ledger_id = $1
          AND a.type IN ('INCOME', 'EXPENSE')
          AND t.posted_at IS NOT NULL
          AND t.transaction_date < $2::date
        GROUP BY a.type, e.direction`,
      [ledgerId, toDateString(beforeDate)],
    );

    let net = 0;
    for (const row of rows as { type: AccountType; direction: 'DEBIT' | 'CREDIT'; amount: string }[]) {
      const amount = parseFloat(row.amount);
      // INCOME is credit-positive; EXPENSE is debit-positive; signed net = +income − +expense.
      const sign = row.type === AccountType.INCOME ? (row.direction === 'CREDIT' ? 1 : -1) : row.direction === 'DEBIT' ? -1 : 1;
      net += sign * amount;
    }
    return net;
  }

  async mapAccountsToGrouped(accounts: AccountWithBalance[], accountType: AccountType, baseCurrency: Currency) {
    const result = (
      await Promise.all(
        accounts
          .filter((account) => account.type === accountType)
          .map(async (account) => {
            const balance = this.computeBalance(account.type, account.debitTotal, account.creditTotal);
            return {
              id: account.id,
              name: account.name,
              description: account.description,
              type: account.type,
              code: account.code,
              creditBalance: account.creditTotal,
              debitBalance: account.debitTotal,
              balance,
              currency: account.currency,
              balanceMainCurrency: await this.forexService.convertCurrency(
                balance,
                account.currency,
                baseCurrency,
                new Date(),
              ),
              retirementAccount: account.retirementAccount,
              groupId: account.group?.id ?? null,
              groupName: account.group?.name ?? null,
            };
          }),
      )
    ).sort((a, b) => this.byCode(a, b));

    return {
      accounts: result,
      total: result.reduce((acc, account) => acc + account.balanceMainCurrency, 0),
      totalWithoutRetirement: result.reduce(
        (acc, account) => acc + (account.retirementAccount ? 0 : account.balanceMainCurrency),
        0,
      ),
    };
  }

  async findAllGroupedByAccountType(
    context: Context,
    options?: {
      filter: { from?: Date; to?: Date };
      excludeClosingEntries?: boolean;
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const accounts = await this.accountsRepository.find({
      where: { ledgerId: ledger.id },
      relations: ['group'],
    });

    const balances = await this.fetchBalancesByLedger(ledger.id, {
      filter: options?.filter,
      restrictDateForTypes: [AccountType.EXPENSE, AccountType.INCOME],
      excludeClosingEntries: options?.excludeClosingEntries,
    });

    // Accounts with at least one posted transaction inside the selected period.
    const from = toDateString(options?.filter?.from ?? new Date('1970-01-01'));
    const to = toDateString(options?.filter?.to ?? new Date('2100-12-31'));
    const periodRows = await this.dataSource.query(
      `SELECT DISTINCT e.account_id AS id
         FROM entries e
         JOIN transactions t ON t.id = e.transaction_id
        WHERE t.ledger_id = $1
          AND t.posted_at IS NOT NULL
          AND t.transaction_date BETWEEN $2::date AND $3::date`,
      [ledger.id, from, to],
    );
    const hasPeriodActivity = new Set<string>((periodRows as { id: string }[]).map((r) => r.id));

    // Show an account when it is active today, had activity in the period, or still
    // carries a non-zero balance (so closed-but-funded accounts keep the totals
    // reconciled). Hide only inactive accounts that are both empty in the period and
    // zeroed out.
    const visibleAccounts = accounts.filter((a) => {
      if (isAccountActive(a) || hasPeriodActivity.has(a.id)) {
        return true;
      }
      const bal = balances.get(a.id);
      return Math.abs(this.computeBalance(a.type, bal?.debit ?? 0, bal?.credit ?? 0)) > 0.005;
    });

    const withBalances: AccountWithBalance[] = visibleAccounts.map((a) => ({
      ...a,
      debitTotal: balances.get(a.id)?.debit ?? 0,
      creditTotal: balances.get(a.id)?.credit ?? 0,
    }));

    return {
      assets: await this.mapAccountsToGrouped(withBalances, AccountType.ASSETS, ledger.baseCurrency),
      liabilities: await this.mapAccountsToGrouped(withBalances, AccountType.LIABILITIES, ledger.baseCurrency),
      equity: await this.mapAccountsToGrouped(withBalances, AccountType.EQUITY, ledger.baseCurrency),
      income: await this.mapAccountsToGrouped(withBalances, AccountType.INCOME, ledger.baseCurrency),
      expense: await this.mapAccountsToGrouped(withBalances, AccountType.EXPENSE, ledger.baseCurrency),
    };
  }

  async createAccount(
    context: Context,
    options: {
      name: string;
      type: AccountType;
      currency?: Currency;
      groupId?: string;
      code?: string;
      description?: string;
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const account = new Account();
    account.ledgerId = ledger.id;
    account.name = options.name;
    account.type = options.type;
    account.code = options.code ?? '';
    account.description = options.description ?? '';
    if (options.currency) {
      account.currency = options.currency;
    }
    if (options.groupId) {
      await this.assertGroupInLedger(options.groupId, ledger.id);
      account.group = { id: options.groupId } as AccountGroup;
    }
    return this.accountsRepository.save(account);
  }

  async updateAccount(
    context: Context,
    accountId: string,
    options: {
      name?: string;
      description?: string;
      groupId?: string | null;
      code?: string;
      activeFrom?: Date | string | null;
      activeUntil?: Date | string | null;
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const account = await this.accountsRepository.findOne({
      where: { id: accountId, ledgerId: ledger.id },
    });
    if (!account) {
      throw new NotFoundException();
    }

    if (options.name !== undefined) {
      account.name = options.name;
    }
    if (options.description !== undefined) {
      account.description = options.description;
    }
    if (options.groupId !== undefined) {
      if (options.groupId) {
        await this.assertGroupInLedger(options.groupId, ledger.id);
      }
      account.group = options.groupId ? ({ id: options.groupId } as AccountGroup) : null;
    }
    if (options.code !== undefined) {
      account.code = options.code;
    }
    if (options.activeFrom !== undefined || options.activeUntil !== undefined) {
      const hasActivityBound =
        (options.activeFrom !== undefined && options.activeFrom !== null) ||
        (options.activeUntil !== undefined && options.activeUntil !== null);
      if (hasActivityBound) {
        await this.assertNotReferencedByLedger(account.id, ledger.id);
      }
      if (options.activeFrom !== undefined) {
        account.activeFrom = options.activeFrom ? toDateString(options.activeFrom) : null;
      }
      if (options.activeUntil !== undefined) {
        account.activeUntil = options.activeUntil ? toDateString(options.activeUntil) : null;
      }
    }
    return this.accountsRepository.save(account);
  }

  async getAccount(context: Context, accountId: string, filter?: { from?: Date | string; to?: Date | string }) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const account = await this.accountsRepository.findOne({
      where: { id: accountId, ledgerId: ledger.id },
      relations: ['group'],
    });

    if (!account) {
      throw new NotFoundException();
    }

    // One row per entry ON THIS account. The other legs of each transaction are aggregated into a JSON
    // array (correlated subquery) — never row-multiplied — so split (>2-leg) transactions like year-end
    // closings appear once and don't inflate the totals below.
    const entries = await this.dataSource.query(
      `SELECT
         e.id            AS "entryId",
         e.direction     AS "direction",
         e.amount        AS "amount",
         t.id            AS "transactionId",
         t.description   AS "description",
         t.transaction_date::text AS "transactionDate",
         COALESCE(
           (SELECT json_agg(json_build_object('id', ca.id, 'name', ca.name) ORDER BY ca.name)
              FROM entries ce
              JOIN accounts ca ON ca.id = ce.account_id
             WHERE ce.transaction_id = t.id AND ce.id <> e.id),
           '[]'::json
         ) AS "counterAccounts"
       FROM entries e
       JOIN transactions t ON t.id = e.transaction_id
       WHERE e.account_id = $1 AND t.posted_at IS NOT NULL
       ORDER BY t.transaction_date ASC, t.created_at ASC`,
      [account.id],
    );

    const transactions = (
      entries as {
        entryId: string;
        direction: 'DEBIT' | 'CREDIT';
        amount: string;
        transactionId: string;
        description: string;
        transactionDate: string;
        counterAccounts: { id: string; name: string }[] | string | null;
      }[]
    ).map((row) => {
      // Signed amount from the user's perspective on THIS account.
      const amount = Number(row.amount);
      const signed =
        account.type === AccountType.ASSETS || account.type === AccountType.EXPENSE
          ? row.direction === 'DEBIT'
            ? amount
            : -amount
          : row.direction === 'CREDIT'
            ? amount
            : -amount;
      const counters = (
        typeof row.counterAccounts === 'string' ? JSON.parse(row.counterAccounts) : (row.counterAccounts ?? [])
      ) as { id: string; name: string }[];
      return {
        id: row.transactionId,
        // Selected as `::text` so it's a calendar-date string ('YYYY-MM-DD'). Reading the raw `date`
        // would have pg build a local-midnight Date that shifts a day when normalised to UTC.
        transactionDate: row.transactionDate,
        description: row.description,
        amount: signed,
        // Exactly one other leg → show it; several (a split, e.g. a closing) → flag `split`.
        counterAccount: counters.length === 1 ? counters[0] : null,
        split: counters.length > 1,
      };
    });

    const debitTotal = (entries as { direction: 'DEBIT' | 'CREDIT'; amount: string }[])
      .filter((e) => e.direction === 'DEBIT')
      .reduce((s, e) => s + Number(e.amount), 0);
    const creditTotal = (entries as { direction: 'DEBIT' | 'CREDIT'; amount: string }[])
      .filter((e) => e.direction === 'CREDIT')
      .reduce((s, e) => s + Number(e.amount), 0);
    const balance = this.computeBalance(account.type, debitTotal, creditTotal);

    // Stats (balance/credit/debit/count) stay lifetime — "Current Balance" must be the true running
    // balance. Only the transaction LIST is scoped to the requested period.
    const from = filter?.from ? toDateString(filter.from) : null;
    const to = filter?.to ? toDateString(filter.to) : null;
    const periodTransactions =
      from || to
        ? transactions.filter((t) => (!from || t.transactionDate >= from) && (!to || t.transactionDate <= to))
        : transactions;

    return {
      id: account.id,
      name: account.name,
      description: account.description,
      type: account.type,
      code: account.code,
      activeFrom: account.activeFrom,
      activeUntil: account.activeUntil,
      isActive: isAccountActive(account),
      balance,
      currency: account.currency,
      retirementAccount: account.retirementAccount,
      group: account.group ? { id: account.group.id, name: account.group.name } : null,
      totalTransactions: transactions.length,
      totalCredit: creditTotal,
      totalDebit: debitTotal,
      transactions: periodTransactions,
    };
  }
}
