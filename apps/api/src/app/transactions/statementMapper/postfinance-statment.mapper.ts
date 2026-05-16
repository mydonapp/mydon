import { parse } from 'csv-parse/sync';
import { MappedTransaction, StatementMapper } from './base-statement.mapper';

export interface PostFinanceStatement {
  date: string;
  typeOfTransactipn: string;
  notificationText: string;
  creditInCHF: number | string;
  debitInCHF: number | string;
}

const headerMappings: Record<keyof PostFinanceStatement, string[]> = {
  date: ['Date', 'Datum'],
  typeOfTransactipn: ['Type of transaction', 'Bewegungstyp'],
  notificationText: ['Notification text', 'Avisierungstext'],
  creditInCHF: ['Credit in CHF', 'Gutschrift in CHF'],
  debitInCHF: ['Debit in CHF', 'Lastschrift in CHF'],
};

interface PostFinanceStatementResponse extends PostFinanceStatement {
  issuer: 'POSTFINANCE';
}

export class PostFinanceStatementMapper extends StatementMapper<PostFinanceStatement> {
  protected async parseStatement(): Promise<PostFinanceStatement[]> {
    const parsed: Record<string, unknown>[] = parse(this.fileContent, {
      cast: true,
      columns: true,
      skip_empty_lines: true,
      bom: true,
      delimiter: ';',
      from_line: 7,
      skip_records_with_error: true,
      relax_quotes: true,
    });

    return parsed.map((x) => {
      const find = (keys: string[]) => Object.entries(x).find(([key]) => keys.includes(key))?.[1];
      return {
        date: find(headerMappings.date) as string,
        creditInCHF: find(headerMappings.creditInCHF) as number | string,
        debitInCHF: find(headerMappings.debitInCHF) as number | string,
        notificationText: find(headerMappings.notificationText) as string,
        typeOfTransactipn: find(headerMappings.typeOfTransactipn) as string,
      };
    });
  }

  protected mapStatement(): Promise<MappedTransaction<PostFinanceStatementResponse>[]> {
    const mappedStatement: MappedTransaction<PostFinanceStatementResponse>[] = [];

    if (!this.statement) {
      throw Error('Statement not initialized');
    }

    for (const transaction of this.statement) {
      const dmy = transaction.date.split('.');

      mappedStatement.push({
        creditAmount: Math.abs(
          transaction.creditInCHF === ''
            ? parseFloat(transaction.debitInCHF.toString())
            : parseFloat(transaction.creditInCHF.toString()),
        ),
        debitAmount: Math.abs(
          transaction.creditInCHF === ''
            ? parseFloat(transaction.debitInCHF.toString())
            : parseFloat(transaction.creditInCHF.toString()),
        ),
        description: transaction.notificationText,
        transactionDate: new Date(parseInt(dmy[2]), parseInt(dmy[1]) - 1, parseInt(dmy[0])),
        raw: {
          ...transaction,
          issuer: 'POSTFINANCE',
        },
      });
    }

    return Promise.resolve(mappedStatement);
  }

  protected getCreditAccountIdFromStatement(
    transaction: MappedTransaction<PostFinanceStatementResponse>,
  ): string | undefined {
    if (transaction.raw.creditInCHF !== '') {
      return this.accountId;
    }
  }
  protected getDebitAccountIdFromStatement(
    transaction: MappedTransaction<PostFinanceStatementResponse>,
  ): string | undefined {
    if (transaction.raw.debitInCHF !== '') {
      return this.accountId;
    }
  }
}
