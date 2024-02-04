import { MappedTransaction, StatementMapper } from './base-statement.mapper';
import { parse } from 'csv-parse/sync';

export interface PostFinanceStatement {
  Datum: string;
  Bewegungstyp: string;
  Avisierungstext: string;
  'Gutschrift in CHF': number | string;
  'Lastschrift in CHF': number | string;
}

interface PostFinanceStatementResponse extends PostFinanceStatement {
  issuer: 'POSTFINANCE';
}

export class PostFinanceStatementMapper extends StatementMapper<PostFinanceStatement> {
  protected async parseStatement(): Promise<PostFinanceStatement[]> {
    return await parse(this.fileContent, {
      cast: true,
      columns: true,
      skip_empty_lines: true,
      bom: true,
      delimiter: ';',
      from_line: 7,
      skip_records_with_error: true,
      relax_quotes: true,
    });
  }

  protected mapStatement(): Promise<
    MappedTransaction<PostFinanceStatementResponse>[]
  > {
    const mappedStatement: MappedTransaction<PostFinanceStatementResponse>[] =
      [];
    for (const transaction of this.statement) {
      const dmy = transaction.Datum.split('.');

      mappedStatement.push({
        creditAmount: Math.abs(
          transaction['Gutschrift in CHF'] === ''
            ? parseFloat(transaction['Lastschrift in CHF'].toString())
            : parseFloat(transaction['Gutschrift in CHF'].toString())
        ),
        debitAmount: Math.abs(
          transaction['Gutschrift in CHF'] === ''
            ? parseFloat(transaction['Lastschrift in CHF'].toString())
            : parseFloat(transaction['Gutschrift in CHF'].toString())
        ),
        description: transaction.Avisierungstext,
        transactionDate: new Date(
          parseInt(dmy[2]),
          parseInt(dmy[1]) - 1,
          parseInt(dmy[0])
        ),
        raw: {
          ...transaction,
          issuer: 'POSTFINANCE',
        },
      });
    }

    return Promise.resolve(mappedStatement);
  }

  protected getCreditAccountIdFromStatement(
    transaction: MappedTransaction<PostFinanceStatementResponse>
  ): string {
    if (transaction.raw['Gutschrift in CHF'] !== '') {
      return this.accountId;
    }
  }
  protected getDebitAccountIdFromStatement(
    transaction: MappedTransaction<PostFinanceStatementResponse>
  ): string {
    if (transaction.raw['Lastschrift in CHF'] !== '') {
      return this.accountId;
    }
  }
}
