import { MappedTransaction, StatementMapper } from './base-statement.mapper';

export interface SwisscardStatement {
  'Transaction date': string;
  Description: string;
  'Card number': string;
  Currency: string;
  Amount: number;
  'Debit/Credit': 'Debit' | 'Credit';
  Status: string;
  Category: string;
}

interface SwisscardStatementResponse extends SwisscardStatement {
  issuer: 'SWISSCARD';
}

export class SwisscardStatementMapper extends StatementMapper<SwisscardStatement> {
  protected mapStatement(): Promise<
    MappedTransaction<SwisscardStatementResponse>[]
  > {
    const mappedStatement: MappedTransaction<SwisscardStatementResponse>[] = [];
    for (const transaction of this.statement) {
      if (transaction.Status !== 'Posted') {
        continue;
      }

      const dmy = transaction['Transaction date'].split('.');

      mappedStatement.push({
        amount: Math.abs(transaction.Amount),
        description: transaction.Description,
        transactionDate: new Date(
          parseInt(dmy[2]),
          parseInt(dmy[1]) - 1,
          parseInt(dmy[0])
        ),
        raw: {
          ...transaction,
          issuer: 'SWISSCARD',
        },
      });
    }

    return Promise.resolve(mappedStatement);
  }

  protected getCreditAccountIdFromStatement(
    transaction: MappedTransaction<SwisscardStatementResponse>
  ): string {
    if (transaction.raw['Debit/Credit'] === 'Credit') {
      return this.accountId;
    }
  }
  protected getDebitAccountIdFromStatement(
    transaction: MappedTransaction<SwisscardStatementResponse>
  ): string {
    if (transaction.raw['Debit/Credit'] === 'Debit') {
      return this.accountId;
    }
  }
}
