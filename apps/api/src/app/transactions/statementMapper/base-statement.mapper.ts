import { Context } from '../../shared/types/context';
import { EntryDirection } from '../entry.entity';
import { TransactionMatcherService } from '../transaction-matcher.service';

export interface MappedTransaction<T> {
  creditAmount: number;
  debitAmount: number;
  description: string;
  transactionDate: Date;
  raw: T;
}

/**
 * Output of the mapper — one "draft" per row of the source statement.
 * The TransactionsService consumes these and turns them into Transaction + 2 Entries.
 */
export interface DraftStatementTransaction {
  creditAmount: number;
  debitAmount: number;
  description: string;
  transactionDate: Date;
  raw: string;
  creditAccountId?: string;
  debitAccountId?: string;
  creditAccountAISuggested?: boolean;
  debitAccountAISuggested?: boolean;
  matchedTransactionId?: string;
}

export abstract class StatementMapper<T> {
  protected statement: T[] | null = null;

  constructor(
    protected context: Context,
    protected fileContent: string,
    protected accountId: string,
    protected transactionMatcher?: TransactionMatcherService,
  ) {}

  protected abstract mapStatement(): Promise<MappedTransaction<T>[]>;

  protected abstract parseStatement(fileContent: string): Promise<T[]>;

  public async convertStatement(): Promise<DraftStatementTransaction[]> {
    if (!this.statement) {
      this.statement = await this.parseStatement(this.fileContent);
    }

    const mappedStatement = await this.mapStatement();
    const drafts: DraftStatementTransaction[] = [];

    for (const transaction of mappedStatement) {
      let creditAccountId = this.getCreditAccountId(transaction);
      let debitAccountId = this.getDebitAccountId(transaction);
      let creditAccountAISuggested = false;
      let debitAccountAISuggested = false;
      let matchedTransactionId: string | undefined;

      if (this.transactionMatcher && (!creditAccountId || !debitAccountId) && transaction.description) {
        const bestMatch = await this.transactionMatcher.getBestMatch(
          this.context.user.id,
          transaction.description,
          0.7,
        );

        if (bestMatch) {
          matchedTransactionId = bestMatch.id;
          const matchedCredit = bestMatch.entries.find((e) => e.direction === EntryDirection.CREDIT)?.accountId;
          const matchedDebit = bestMatch.entries.find((e) => e.direction === EntryDirection.DEBIT)?.accountId;

          if (!creditAccountId && matchedCredit) {
            creditAccountId = matchedCredit;
            creditAccountAISuggested = true;
          }
          if (!debitAccountId && matchedDebit) {
            debitAccountId = matchedDebit;
            debitAccountAISuggested = true;
          }
        }
      }

      drafts.push({
        creditAmount: transaction.creditAmount,
        debitAmount: transaction.debitAmount,
        description: transaction.description,
        creditAccountId,
        debitAccountId,
        transactionDate: transaction.transactionDate,
        raw: JSON.stringify(transaction.raw),
        creditAccountAISuggested,
        debitAccountAISuggested,
        matchedTransactionId,
      });
    }

    return drafts;
  }

  protected abstract getCreditAccountIdFromStatement(transaction: MappedTransaction<T>): string | undefined;

  private getCreditAccountId(transaction: MappedTransaction<T>): string | undefined {
    return this.getCreditAccountIdFromStatement(transaction);
  }

  protected abstract getDebitAccountIdFromStatement(transaction: MappedTransaction<T>): string | undefined;

  private getDebitAccountId(transaction: MappedTransaction<T>): string | undefined {
    return this.getDebitAccountIdFromStatement(transaction);
  }
}
