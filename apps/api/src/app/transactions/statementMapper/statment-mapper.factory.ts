import { PostFinanceStatementMapper } from './postfinance-statment.mapper';
import {
  SwisscardStatement,
  SwisscardStatementMapper,
} from './swisscard-statement.mapper';
import { WiseStatementMapper } from './wise-statement.mapper';
import { YuhStatementMapper } from './yuh-statment.mapper';

type StatementMapper =
  | SwisscardStatementMapper
  | PostFinanceStatementMapper
  | WiseStatementMapper
  | YuhStatementMapper;
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
    if (statementIssuer === 'YUH') {
      return new YuhStatementMapper(fileContent, accountId);
    }
    throw new Error('Invalid statement issuer');
  }
}
