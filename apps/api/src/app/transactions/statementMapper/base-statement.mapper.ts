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

  constructor(protected fileContent: string, protected accountId: string) {}

  protected abstract mapStatement(): Promise<MappedTransaction<T>[]>;

  protected abstract parseStatement(fileContent: string): Promise<T[]>;

  public async convertStatement(): Promise<Transaction[]> {
    if (!this.statement) {
      this.statement = await this.parseStatement(this.fileContent);
    }

    const mappedStatement = await this.mapStatement();
    return mappedStatement.map((transaction) => {
      const newTransaction = Transaction.create({
        creditAmount: transaction.creditAmount,
        debitAmount: transaction.debitAmount,
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
