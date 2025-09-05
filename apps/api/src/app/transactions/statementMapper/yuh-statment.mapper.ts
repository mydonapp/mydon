import { MappedTransaction, StatementMapper } from './base-statement.mapper';
import { parse } from 'csv-parse/sync';

export interface YuhStatement {
  DATE: string;
  DEBIT: number;
  CREDIT: number;
  'ACTIVITY NAME': string;
}

interface YuhStatementResponse extends YuhStatement {
  issuer: 'YUH';
}

export class YuhStatementMapper extends StatementMapper<YuhStatement> {
  protected async parseStatement(): Promise<YuhStatement[]> {
    return await parse(this.fileContent, {
      cast: true,
      columns: true,
      skip_empty_lines: true,
      bom: true,
      delimiter: ';',
    });
  }

  protected mapStatement(): Promise<MappedTransaction<YuhStatementResponse>[]> {
    const mappedStatement: MappedTransaction<YuhStatementResponse>[] = [];
    for (const transaction of this.statement) {
      const dmy = transaction.DATE.split('/');

      mappedStatement.push({
        creditAmount: transaction.CREDIT
          ? Math.abs(transaction.CREDIT)
          : Math.abs(transaction.DEBIT),
        debitAmount: transaction.CREDIT
          ? Math.abs(transaction.CREDIT)
          : Math.abs(transaction.DEBIT),
        description: transaction['ACTIVITY NAME'].substring(
          1,
          transaction['ACTIVITY NAME'].length - 1,
        ),
        transactionDate: new Date(
          parseInt(dmy[2]),
          parseInt(dmy[1]) - 1,
          parseInt(dmy[0]),
        ),
        raw: {
          ...transaction,
          issuer: 'YUH',
        },
      });
    }

    return Promise.resolve(mappedStatement);
  }

  protected getCreditAccountIdFromStatement(
    transaction: MappedTransaction<YuhStatementResponse>,
  ): string {
    if (transaction.raw.CREDIT) {
      return this.accountId;
    }
  }
  protected getDebitAccountIdFromStatement(
    transaction: MappedTransaction<YuhStatementResponse>,
  ): string {
    if (transaction.raw.DEBIT) {
      return this.accountId;
    }
  }
}
