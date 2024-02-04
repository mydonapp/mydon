import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatementMapperFactory } from './statementMapper/statment-mapper.factory';
import { Transaction } from './transactions.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>
  ) {}

  findAll(filter?: string) {
    const where = {};

    if (filter === 'draft') {
      where['draft'] = true;
    }

    return this.transactionRepository.find({ where, loadRelationIds: true });
  }

  createTransaction(options: {
    creditAmount: number;
    debitAmount: number;
    description: string;
    creditAccountId: string;
    debitAccountId: string;
    transactionDate: Date;
  }) {
    const transaction = Transaction.create(options);
    return this.transactionRepository.save(transaction);
  }

  deleteTransaction(id: string) {
    return this.transactionRepository.delete(id);
  }

  async patchTransaction(
    id: string,
    options: {
      creditAmount?: number;
      debitAmount?: number;
      description?: string;
      creditAccountId?: string;
      debitAccountId?: string;
      draft?: boolean;
    }
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
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
      transaction.creditAccount = options.creditAccountId as any;
    }
    if (options.debitAccountId) {
      transaction.debitAccount = options.debitAccountId as any;
    }
    if ('draft' in options) {
      transaction.draft = options.draft;
    }

    return this.transactionRepository.save(transaction);
  }

  async importStatement(
    fileContent: string,
    statementIssuer: string,
    accountId: string
  ) {
    const mapper = StatementMapperFactory.create(
      fileContent,
      statementIssuer,
      accountId
    );

    const transactions = await mapper.convertStatement();
    return this.transactionRepository.save(transactions);
  }
}
