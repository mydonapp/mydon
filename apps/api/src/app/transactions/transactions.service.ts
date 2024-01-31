import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transactions.entity';
import {
  Statement,
  StatementMapperFactory,
} from './statementMapper/statment-mapper.factory';

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
    amount: number;
    description: string;
    creditAccountId: string;
    debitAccountId: string;
    transactionDate: Date;
  }) {
    const transaction = Transaction.create(options);
    return this.transactionRepository.save(transaction);
  }

  async patchTransaction(
    id: string,
    options: {
      amount?: number;
      description?: string;
      creditAccountId?: string;
      debitAccountId?: string;
      draft?: boolean;
    }
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (options.amount) {
      transaction.amount = options.amount;
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
    csv: Statement[],
    statementIssuer: string,
    accountId: string
  ) {
    const mapper = StatementMapperFactory.create(
      csv,
      statementIssuer,
      accountId
    );

    const transactions = await mapper.convertStatement();
    return this.transactionRepository.save(transactions);
  }
}
