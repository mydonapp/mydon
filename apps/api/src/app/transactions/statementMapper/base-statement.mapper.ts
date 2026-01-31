import { Context } from '../../shared/types/context';
import { TransactionMatcherService } from '../transaction-matcher.service';
import { Transaction } from '../transactions.entity';

export interface MappedTransaction<T> {
  creditAmount: number;
  debitAmount: number;
  description: string;
  transactionDate: Date;
  raw: T;
}

export abstract class StatementMapper<T> {
  protected statement: T[];

  constructor(
    protected context: Context,
    protected fileContent: string,
    protected accountId: string,
    protected transactionMatcher?: TransactionMatcherService,
  ) {}

  protected abstract mapStatement(): Promise<MappedTransaction<T>[]>;

  protected abstract parseStatement(fileContent: string): Promise<T[]>;

  public async convertStatement(): Promise<Transaction[]> {
    if (!this.statement) {
      this.statement = await this.parseStatement(this.fileContent);
    }

    const mappedStatement = await this.mapStatement();
    const transactions: Transaction[] = [];

    for (const transaction of mappedStatement) {
      console.log('transacvtions', transactions);
      let creditAccountId = this.getCreditAccountId(transaction);
      let debitAccountId = this.getDebitAccountId(transaction);
      let creditAccountAISuggested = false;
      let debitAccountAISuggested = false;
      let matchedTransactionId: string | undefined;

      // If accounts are not provided from statement, try to find similar transactions
      if (
        this.transactionMatcher &&
        (!creditAccountId || !debitAccountId) &&
        transaction.description
      ) {
        const bestMatch = await this.transactionMatcher.getBestMatch(
          this.context.user.id,
          transaction.description,
          0.7, // 70% similarity threshold
        );

        if (bestMatch) {
          matchedTransactionId = bestMatch.id;

          // Use matched transaction's accounts if not already set
          if (!creditAccountId && bestMatch.creditAccount) {
            creditAccountId = bestMatch.creditAccount.id;
            creditAccountAISuggested = true;
          }
          if (!debitAccountId && bestMatch.debitAccount) {
            debitAccountId = bestMatch.debitAccount.id;
            debitAccountAISuggested = true;
          }
        }
      }

      const newTransaction = Transaction.create({
        creditAmount: transaction.creditAmount,
        debitAmount: transaction.debitAmount,
        description: transaction.description,
        creditAccountId: creditAccountId,
        debitAccountId: debitAccountId,
        transactionDate: transaction.transactionDate,
        draft: true,
        raw: JSON.stringify(transaction.raw),
        userId: this.context.user.id,
        creditAccountAISuggested,
        debitAccountAISuggested,
        matchedTransactionId,
      });

      transactions.push(newTransaction);
    }

    return transactions;
  }

  protected abstract getCreditAccountIdFromStatement(
    transaction: MappedTransaction<T>,
  ): string | undefined;

  private getCreditAccountId(
    transaction: MappedTransaction<T>,
  ): string | undefined {
    const creditAccountIdFromStatement =
      this.getCreditAccountIdFromStatement(transaction);
    if (creditAccountIdFromStatement) {
      return creditAccountIdFromStatement;
    }
  }

  protected abstract getDebitAccountIdFromStatement(
    transaction: MappedTransaction<T>,
  ): string | undefined;

  private getDebitAccountId(
    transaction: MappedTransaction<T>,
  ): string | undefined {
    const debitAccountIdFromStatement =
      this.getDebitAccountIdFromStatement(transaction);
    if (debitAccountIdFromStatement) {
      return debitAccountIdFromStatement;
    }
  }
}
