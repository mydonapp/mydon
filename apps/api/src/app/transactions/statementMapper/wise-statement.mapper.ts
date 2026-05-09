import { parse } from 'csv-parse/sync';
import { MappedTransaction, StatementMapper } from './base-statement.mapper';

export interface WiseStatement {
  Date: string;
  Amount: number;
  Description: string;
  'Exchange To Amount': string;
  Currency: string;
}

interface WiseStatementResponse extends WiseStatement {
  issuer: 'WISE';
}

export class WiseStatementMapper extends StatementMapper<WiseStatement> {
  protected async parseStatement(): Promise<WiseStatement[]> {
    return await parse(this.fileContent, {
      cast: true,
      columns: true,
      skip_empty_lines: true,
      bom: true,
    });
  }

  protected mapStatement(): Promise<MappedTransaction<WiseStatementResponse>[]> {
    const mappedStatement: MappedTransaction<WiseStatementResponse>[] = [];

    if (!this.statement) {
      throw Error('Statement not initialized');
    }

    for (const transaction of this.statement) {
      // For now we just add posted transactions as well
      // if (transaction.Status !== 'Posted') {
      //   continue;
      // }

      const dmy = transaction.Date.split('-');

      mappedStatement.push({
        creditAmount: Math.abs(transaction.Amount),
        debitAmount: Math.abs(transaction.Amount),
        description: transaction.Description,
        transactionDate: new Date(parseInt(dmy[2]), parseInt(dmy[1]) - 1, parseInt(dmy[0])),
        raw: {
          ...transaction,
          issuer: 'WISE',
        },
      });
    }

    return Promise.resolve(mappedStatement);
  }

  protected getCreditAccountIdFromStatement(transaction: MappedTransaction<WiseStatementResponse>): string | undefined {
    if (transaction.raw.Amount >= 0) {
      return this.accountId;
    }
  }
  protected getDebitAccountIdFromStatement(transaction: MappedTransaction<WiseStatementResponse>): string | undefined {
    if (transaction.raw.Amount < 0) {
      return this.accountId;
    }
  }
}
