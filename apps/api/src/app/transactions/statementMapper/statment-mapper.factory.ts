import { PostFinanceStatementMapper } from './postfinance-statment.mapper';
import {
  SwisscardStatement,
  SwisscardStatementMapper,
} from './swisscard-statement.mapper';
import { WiseStatementMapper } from './wise-statement.mapper';

type StatementMapper =
  | SwisscardStatementMapper
  | PostFinanceStatementMapper
  | WiseStatementMapper;
export type Statement = SwisscardStatement;

export class StatementMapperFactory {
  constructor() {
    throw new Error('Cannot instantiate factory');
  }

  static create(
    fileContent: string,
    statementIssuer,
    accountId: string
  ): StatementMapper {
    if (statementIssuer === 'SWISSCARD') {
      return new SwisscardStatementMapper(fileContent, accountId);
    }
    if (statementIssuer === 'POSTFINANCE') {
      return new PostFinanceStatementMapper(fileContent, accountId);
    }
    if (statementIssuer === 'WISE') {
      return new WiseStatementMapper(fileContent, accountId);
    }
    throw new Error('Invalid statement issuer');
  }
}
