import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { LedgersService } from '../ledgers/ledgers.service';
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
    private forexService: ForexService,
    private ledgersService: LedgersService,
    private dataSource: DataSource,
  ) {}

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
    options?: { filter?: { from?: Date; to?: Date }; restrictDateForTypes?: AccountType[] },
  ): Promise<Map<string, { debit: number; credit: number }>> {
    const from = options?.filter?.from ?? new Date('1970-01-01');
    const to = options?.filter?.to
      ? new Date(new Date(options.filter.to).setUTCHours(23, 59, 59, 999))
      : new Date('2100-12-31');
    const restrictedTypes = options?.restrictDateForTypes ?? [];

    // For EXPENSE / INCOME accounts the period applies; for balance-sheet accounts (assets/liabilities/equity),
    // sum the entries up to the period end so balances reflect everything through `to`.
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
           AND (
             a.type::text = ANY($2::text[]) AND t.transaction_date BETWEEN $3::timestamptz AND $4::timestamptz
             OR NOT (a.type::text = ANY($2::text[]))
             AND t.transaction_date <= $4::timestamptz
           )
         ))
       GROUP BY a.id`,
      [ledgerId, restrictedTypes, from.toISOString(), to.toISOString()],
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
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const accounts = await this.accountsRepository.find({
      where: { ledgerId: ledger.id },
      relations: ['group'],
    });

    // Filter to active accounts OR accounts that have at least one entry (mirrors prior behavior).
    const visibleAccounts: Account[] = [];
    for (const a of accounts) {
      if (isAccountActive(a)) {
        visibleAccounts.push(a);
        continue;
      }
      const hasEntry = await this.dataSource.query(`SELECT 1 FROM entries WHERE account_id = $1 LIMIT 1`, [a.id]);
      if (hasEntry.length > 0) {
        visibleAccounts.push(a);
      }
    }

    const balances = await this.fetchBalancesByLedger(ledger.id, {
      filter: options?.filter,
      restrictDateForTypes: [AccountType.EXPENSE, AccountType.INCOME],
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
    },
  ) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const account = new Account();
    account.ledgerId = ledger.id;
    account.name = options.name;
    account.type = options.type;
    account.code = options.code ?? '';
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
    if (options.groupId !== undefined) {
      if (options.groupId) {
        await this.assertGroupInLedger(options.groupId, ledger.id);
      }
      account.group = options.groupId ? ({ id: options.groupId } as AccountGroup) : null;
    }
    if (options.code !== undefined) {
      account.code = options.code;
    }
    if (options.activeFrom !== undefined) {
      account.activeFrom = options.activeFrom ? new Date(options.activeFrom) : null;
    }
    if (options.activeUntil !== undefined) {
      account.activeUntil = options.activeUntil ? new Date(options.activeUntil) : null;
    }
    return this.accountsRepository.save(account);
  }

  async getAccount(context: Context, accountId: string) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const account = await this.accountsRepository.findOne({
      where: { id: accountId, ledgerId: ledger.id },
      relations: ['group'],
    });

    if (!account) {
      throw new NotFoundException();
    }

    // Load entries on this account, joined with the parent transaction header and the other side
    // (the counter-account) so we can render the per-account transaction list with counter info.
    const entries = await this.dataSource.query(
      `SELECT
         e.id            AS "entryId",
         e.direction     AS "direction",
         e.amount        AS "amount",
         t.id            AS "transactionId",
         t.description   AS "description",
         t.transaction_date AS "transactionDate",
         counter.id      AS "counterAccountId",
         counter.name    AS "counterAccountName"
       FROM entries e
       JOIN transactions t ON t.id = e.transaction_id
       LEFT JOIN entries counter_entry
         ON counter_entry.transaction_id = t.id AND counter_entry.id <> e.id
       LEFT JOIN accounts counter ON counter.id = counter_entry.account_id
       WHERE e.account_id = $1 AND t.posted_at IS NOT NULL
       ORDER BY t.transaction_date ASC`,
      [account.id],
    );

    const transactions = (
      entries as {
        entryId: string;
        direction: 'DEBIT' | 'CREDIT';
        amount: string;
        transactionId: string;
        description: string;
        transactionDate: Date;
        counterAccountId: string | null;
        counterAccountName: string | null;
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
      return {
        id: row.transactionId,
        transactionDate: row.transactionDate,
        description: row.description,
        amount: signed,
        counterAccount: row.counterAccountId ? { id: row.counterAccountId, name: row.counterAccountName ?? '' } : null,
      };
    });

    const debitTotal = (entries as { direction: 'DEBIT' | 'CREDIT'; amount: string }[])
      .filter((e) => e.direction === 'DEBIT')
      .reduce((s, e) => s + Number(e.amount), 0);
    const creditTotal = (entries as { direction: 'DEBIT' | 'CREDIT'; amount: string }[])
      .filter((e) => e.direction === 'CREDIT')
      .reduce((s, e) => s + Number(e.amount), 0);
    const balance = this.computeBalance(account.type, debitTotal, creditTotal);

    return {
      id: account.id,
      name: account.name,
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
      transactions,
    };
  }
}
