import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountGroup } from '../account-groups/account-group.entity';
import { LedgersService } from '../ledgers/ledgers.service';
import { ForexService } from '../shared/forex/forex.service';
import { Context } from '../shared/types/context';
import { isAccountActive } from './account-active';
import { Account, AccountType, Currency } from './accounts.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private forexService: ForexService,
    private ledgersService: LedgersService,
  ) {}

  async findAllSimple(context: Context) {
    const ledger = await this.ledgersService.getDefaultLedgerForUser(context.user.id);
    const accounts = await this.accountsRepository.find({
      where: { ledgerId: ledger.id },
      relations: ['group'],
    });

    accounts.sort((a, b) => {
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
    });

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      isActive: isAccountActive(account),
      activeFrom: account.activeFrom,
      activeUntil: account.activeUntil,
      retirementAccount: account.retirementAccount,
      openingBalance: account.openingBalance,
      code: account.code,
      groupId: account.group?.id ?? null,
      groupName: account.group?.name ?? null,
    }));
  }

  async mapAccountsToGrouped(accounts: Account[], accountType: AccountType) {
    const result = (
      await Promise.all(
        accounts
          .filter((account) => account.type === accountType)
          .map(async (account) => {
            const creditBalance = account.creditBalance || 0 + account.openingBalance;

            return {
              id: account.id,
              name: account.name,
              type: account.type,
              code: account.code,
              creditBalance: creditBalance,
              debitBalance: account.debitBalance,
              balance: account.balance,
              currency: account.currency,
              balanceMainCurrency: await this.forexService.convertCurrency(
                account.balance,
                account.currency,
                'CHF',
                new Date(),
              ),
              retirementAccount: account.retirementAccount,
              groupId: account.group?.id ?? null,
              groupName: account.group?.name ?? null,
            };
          }),
      )
    ).sort((a, b) => b.balanceMainCurrency - a.balanceMainCurrency);

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
    const query = this.accountsRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.group', 'group')
      .addSelect(
        `(SELECT COALESCE(SUM("debitTransaction"."debitAmount"), 0)
          FROM transactions "debitTransaction"
          WHERE "debitTransaction"."debitAccountId" = account.id
          AND "debitTransaction"."userId" = :userId
          AND (
            account.type IN (:...filteredTypes)
            AND "debitTransaction"."transactionDate" BETWEEN cast(:from as timestamptz) AND cast(:to as timestamptz)
            OR account.type NOT IN (:...filteredTypes)
          )
        )`,
        'account_debitBalance',
      )
      .addSelect(
        `(SELECT COALESCE(SUM("creditTransaction"."creditAmount"), 0)
          FROM transactions "creditTransaction"
          WHERE "creditTransaction"."creditAccountId" = account.id
          AND "creditTransaction"."userId" = :userId
          AND (
            account.type IN (:...filteredTypes)
            AND "creditTransaction"."transactionDate" BETWEEN cast(:from as timestamptz) AND cast(:to as timestamptz)
            OR account.type NOT IN (:...filteredTypes)
          )
        )`,
        'account_creditBalance',
      )
      .where('account."ledger_id" = :ledgerId')
      .andWhere(
        `(
        (account."active_until" IS NULL OR account."active_until" > NOW())
        OR EXISTS (
          SELECT 1 FROM transactions t
          WHERE t."creditAccountId" = account.id OR t."debitAccountId" = account.id
        )
      )`,
      )
      .setParameters({
        from: options?.filter?.from || new Date('1970-01-01'),
        to: options?.filter?.to ? new Date(options?.filter?.to?.setUTCHours(23, 59, 59, 999)) : new Date('2100-12-31'),
        filteredTypes: ['EXPENSE', 'INCOME'],
        userId: context.user.id,
        ledgerId: ledger.id,
      });

    const result = await query.getMany();

    const grouped = {
      assets: await this.mapAccountsToGrouped(result, AccountType.ASSETS),
      liabilities: await this.mapAccountsToGrouped(result, AccountType.LIABILITIES),
      equity: await this.mapAccountsToGrouped(result, AccountType.EQUITY),
      income: await this.mapAccountsToGrouped(result, AccountType.INCOME),
      expense: await this.mapAccountsToGrouped(result, AccountType.EXPENSE),
    };

    return grouped;
  }

  async createAccount(
    context: Context,
    options: {
      name: string;
      type: AccountType;
      openingBalance: number;
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
    account.openingBalance = options.openingBalance;
    account.code = options.code ?? '';
    if (options.currency) {
      account.currency = options.currency;
    }
    if (options.groupId) {
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
      openingBalance?: number;
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
    if (options.openingBalance !== undefined) {
      account.openingBalance = options.openingBalance;
    }
    if (options.groupId !== undefined) {
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
      relations: [
        'group',
        'debitTransactions',
        'creditTransactions',
        'creditTransactions.debitAccount',
        'debitTransactions.creditAccount',
      ],
    });

    if (!account) {
      throw new NotFoundException();
    }

    const totalCredit = account.creditTransactions.reduce((sum, t) => sum + Number(t.creditAmount), 0);
    const totalDebit = account.debitTransactions.reduce((sum, t) => sum + Number(t.debitAmount), 0);
    const totalTransactions = account.creditTransactions.length + account.debitTransactions.length;

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      code: account.code,
      activeFrom: account.activeFrom,
      activeUntil: account.activeUntil,
      isActive: isAccountActive(account),
      balance: account.balance,
      currency: account.currency,
      retirementAccount: account.retirementAccount,
      group: account.group ? { id: account.group.id, name: account.group.name } : null,
      totalTransactions,
      totalCredit,
      totalDebit,
      transactions: [
        ...(account.debitTransactions.map((x) => ({
          id: x.id,
          transactionDate: x.transactionDate,
          description: x.description,
          amount:
            account.type === AccountType.INCOME || account.type === AccountType.LIABILITIES
              ? x.debitAmount
              : x.debitAmount * -1,
          counterAccount: {
            id: x.creditAccount.id,
            name: x.creditAccount.name,
          },
        })) || []),
        ...(account.creditTransactions.map((x) => ({
          id: x.id,
          transactionDate: x.transactionDate,
          description: x.description,
          amount:
            account.type === AccountType.ASSETS || account.type === AccountType.EXPENSE
              ? x.creditAmount
              : x.creditAmount * -1,
          counterAccount: {
            id: x.debitAccount.id,
            name: x.debitAccount.name,
          },
        })) || []),
      ].sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime()),
    };
  }
}
