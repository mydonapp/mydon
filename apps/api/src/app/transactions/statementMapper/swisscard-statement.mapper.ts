import { parse } from 'csv-parse/sync';
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
  protected async parseStatement(): Promise<SwisscardStatement[]> {
    return await parse(this.fileContent, {
      cast: true,
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });
  }

  protected mapStatement(): Promise<MappedTransaction<SwisscardStatementResponse>[]> {
    const mappedStatement: MappedTransaction<SwisscardStatementResponse>[] = [];

    if (!this.statement) {
      throw Error('Statement not initialized');
    }

    for (const transaction of this.statement) {
      // For now we just add posted transactions as well
      // if (transaction.Status !== 'Posted') {
      //   continue;
      // }

      const dmy = transaction['Transaction date'].split('.');

      mappedStatement.push({
        creditAmount: Math.abs(transaction.Amount),
        debitAmount: Math.abs(transaction.Amount),
        description: transaction.Description,
        transactionDate: new Date(parseInt(dmy[2]), parseInt(dmy[1]) - 1, parseInt(dmy[0])),
        raw: {
          ...transaction,
          issuer: 'SWISSCARD',
        },
      });
    }

    return Promise.resolve(mappedStatement);
  }

  protected getCreditAccountIdFromStatement(
    transaction: MappedTransaction<SwisscardStatementResponse>,
  ): string | undefined {
    if (transaction.raw['Debit/Credit'] === 'Credit') {
      return this.accountId;
    }
  }
  protected getDebitAccountIdFromStatement(
    transaction: MappedTransaction<SwisscardStatementResponse>,
  ): string | undefined {
    if (transaction.raw['Debit/Credit'] === 'Debit') {
      return this.accountId;
    }
  }
}
