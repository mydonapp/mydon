import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/accounts.entity';
import { Context } from '../shared/types/context';
import { StatementMapperFactory } from './statementMapper/statment-mapper.factory';
import { TransactionMatcherService } from './transaction-matcher.service';
import { Transaction } from './transactions.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private transactionMatcher: TransactionMatcherService,
  ) {}

  findAll(context: Context, filter?: string) {
    const where = {
      user: { id: context.user.id },
    };

    if (filter === 'draft') {
      where['draft'] = true;
    }

    return this.transactionRepository.find({
      where,
      relations: ['creditAccount', 'debitAccount'],
      order: { transactionDate: 'DESC' },
    });
  }

  async createTransaction(
    context: Context,
    options: {
      creditAmount: number;
      debitAmount: number;
      description: string;
      creditAccountId: string;
      debitAccountId: string;
      transactionDate: Date;
    },
  ) {
    const [credit, debit] = await Promise.all([
      this.accountRepository.findOne({ where: { id: options.creditAccountId } }),
      this.accountRepository.findOne({ where: { id: options.debitAccountId } }),
    ]);
    if (credit?.deactivatedAt || debit?.deactivatedAt) {
      throw new BadRequestException('Cannot add transactions to a deactivated account');
    }
    const transaction = Transaction.create({
      ...options,
      userId: context.user.id,
    });
    return this.transactionRepository.save(transaction);
  }

  deleteTransaction(context: Context, id: string) {
    return this.transactionRepository.delete({
      id,
      user: { id: context.user.id },
    });
  }

  async patchTransaction(
    context: Context,
    id: string,
    options: {
      creditAmount?: number;
      debitAmount?: number;
      description?: string;
      creditAccountId?: string;
      debitAccountId?: string;
      draft?: boolean;
    },
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { id, user: { id: context.user.id } },
    });

    if (options.creditAmount) {
      transaction.creditAmount = options.creditAmount;
    }
    if (options.debitAmount) {
      transaction.debitAmount = options.debitAmount;
    }
    if (options.description) {
      transaction.description = options.description;
    }
    if (options.creditAccountId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.creditAccount = options.creditAccountId as any;
    }
    if (options.debitAccountId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transaction.debitAccount = options.debitAccountId as any;
    }
    if ('draft' in options) {
      transaction.draft = options.draft;
    }

    return this.transactionRepository.save(transaction);
  }

  async importStatement(
    context: Context,
    fileContent: string,
    statementIssuer: string,
    accountId: string,
  ) {
    const importAccount = await this.accountRepository.findOne({ where: { id: accountId } });
    if (importAccount?.deactivatedAt) {
      throw new BadRequestException('Cannot import into a deactivated account');
    }
    const mapper = StatementMapperFactory.create(
      context,
      fileContent,
      statementIssuer,
      accountId,
      this.transactionMatcher,
    );

    const transactions = await mapper.convertStatement();
    return this.transactionRepository.save(transactions);
  }
}
