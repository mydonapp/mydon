import { Transaction } from '../transactions.entity';

export interface MappedTransaction<T> {
  amount: number;
  description: string;
  transactionDate: Date;
  raw: T;
}

export abstract class StatementMapper<T> {
  constructor(protected statement: T[], protected accountId: string) {}

  protected abstract mapStatement(): Promise<MappedTransaction<T>[]>;

  async convertStatement(): Promise<Transaction[]> {
    const mappedStatement = await this.mapStatement();
    return mappedStatement.map((transaction) => {
      const newTransaction = Transaction.create({
        amount: transaction.amount,
        description: transaction.description,
        creditAccountId: this.getCreditAccountId(transaction),
        debitAccountId: this.getDebitAccountId(transaction),
        transactionDate: transaction.transactionDate,
        draft: true,
        raw: JSON.stringify(transaction.raw),
      });
      return newTransaction;
    });
  }

  protected abstract getCreditAccountIdFromStatement(
    transaction: MappedTransaction<T>
  ): string | undefined;

  private getCreditAccountId(
    transaction: MappedTransaction<T>
  ): string | undefined {
    const creditAccountIdFromStatement =
      this.getCreditAccountIdFromStatement(transaction);
    if (creditAccountIdFromStatement) {
      return creditAccountIdFromStatement;
    }
  }

  protected abstract getDebitAccountIdFromStatement(
    transaction: MappedTransaction<T>
  ): string | undefined;

  private getDebitAccountId(
    transaction: MappedTransaction<T>
  ): string | undefined {
    const debitAccountIdFromStatement =
      this.getDebitAccountIdFromStatement(transaction);
    if (debitAccountIdFromStatement) {
      return debitAccountIdFromStatement;
    }
  }
}
