import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForexService } from '../shared/forex/forex.service';
import { Context } from '../shared/types/context';
import { Account, AccountType } from './accounts.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    private forexService: ForexService
  ) {}

  async findAll() {
    const result = await this.accountsRepository.find();
    return result.map((account) => {
      const creditBalance = account.creditBalance + account.openingBalance;

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        creditBalance: creditBalance,
        debitBalance: account.debitBalance,
        balance: account.balance,
        currency: account.currency,
      };
    });
  }

  async mapAccountsToGrouped(accounts: Account[], accountType: AccountType) {
    const result = (
      await Promise.all(
        accounts
          .filter((account) => account.type === accountType)
          .map(async (account) => {
            const creditBalance =
              account.creditBalance + account.openingBalance;

            return {
              id: account.id,
              name: account.name,
              type: account.type,
              creditBalance: creditBalance,
              debitBalance: account.debitBalance,
              balance: account.balance,
              currency: account.currency,
              balanceMainCurrency: await this.forexService.convertCurrency(
                account.balance,
                account.currency,
                'CHF',
                new Date()
              ),
              retirementAccount: account.retirementAccount,
            };
          })
      )
    ).sort((a, b) => b.balanceMainCurrency - a.balanceMainCurrency);

    return {
      accounts: result,
      total: result.reduce(
        (acc, account) => acc + account.balanceMainCurrency,
        0
      ),
      totalWithoutRetirement: result.reduce(
        (acc, account) =>
          acc + (account.retirementAccount ? 0 : account.balanceMainCurrency),
        0
      ),
    };
  }

  async findAllGroupedByAccountType(
    context: Context,
    options?: {
      filter: { from: Date; to: Date };
    }
  ) {
    const query = this.accountsRepository
      .createQueryBuilder('account')
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
        'account_debitBalance'
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
        'account_creditBalance'
      )
      .where('account."userId" = :userId')
      .setParameters({
        from: options?.filter?.from || new Date('1970-01-01'),
        to: options?.filter?.to
          ? new Date(options?.filter?.to?.setUTCHours(23, 59, 59, 999))
          : new Date('2100-12-31'),
        filteredTypes: ['EXPENSE', 'INCOME'],
        userId: context.user.id,
      });

    const result = await query.getMany();

    const grouped = {
      assets: await this.mapAccountsToGrouped(result, AccountType.ASSETS),
      liabilities: await this.mapAccountsToGrouped(
        result,
        AccountType.LIABILITIES
      ),
      equity: await this.mapAccountsToGrouped(result, AccountType.EQUITY),
      income: await this.mapAccountsToGrouped(result, AccountType.INCOME),
      expense: await this.mapAccountsToGrouped(result, AccountType.EXPENSE),
    };

    return grouped;
  }

  async test() {
    const a = await this.accountsRepository.findOne({ where: { id: '' } });
    a.setInactive();
    return a;
  }

  createAccount(
    context: Context,
    options: {
      name: string;
      type: AccountType;
      openingBalance: number;
    }
  ) {
    const account = new Account();
    account.name = options.name;
    account.type = options.type;
    account.openingBalance = options.openingBalance;
    account.user.id = context.user.id;
    return this.accountsRepository.save(account);
  }

  async getAccount(context: Context, accountId: string) {
    const account = await this.accountsRepository.findOne({
      where: { id: accountId, user: { id: context.user.id } },
      relations: [
        'debitTransactions',
        'creditTransactions',
        'creditTransactions.debitAccount',
        'debitTransactions.creditAccount',
      ],
    });

    if (!account) {
      throw new NotFoundException();
    }

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      debitTransactions: account.debitTransactions,
      creditTransactions: account.creditTransactions,
      transactions: [
        ...(account.debitTransactions.map((x) => ({
          id: x.id,
          transactionDate: x.transactionDate,
          description: x.description,
          amount:
            account.type === AccountType.INCOME ||
            account.type === AccountType.LIABILITIES
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
            account.type === AccountType.ASSETS ||
            account.type === AccountType.EXPENSE
              ? x.creditAmount
              : x.creditAmount * -1,
          counterAccount: {
            id: x.debitAccount.id,
            name: x.debitAccount.name,
          },
        })) || []),
      ].sort(
        (a, b) => a.transactionDate.getTime() - b.transactionDate.getTime()
      ),
    };
  }
}
