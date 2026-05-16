import { Context } from '../../shared/types/context';
import { TransactionMatcherService } from '../transaction-matcher.service';
import { PostFinanceStatementMapper } from './postfinance-statment.mapper';
import { SwisscardStatement, SwisscardStatementMapper } from './swisscard-statement.mapper';
import { WiseStatementMapper } from './wise-statement.mapper';
import { YuhStatementMapper } from './yuh-statment.mapper';

type StatementMapper = SwisscardStatementMapper | PostFinanceStatementMapper | WiseStatementMapper | YuhStatementMapper;
export type Statement = SwisscardStatement;

export class StatementMapperFactory {
  constructor() {
    throw new Error('Cannot instantiate factory');
  }

  static create(
    context: Context,
    fileContent: string,
    statementIssuer: string,
    accountId: string,
    transactionMatcher?: TransactionMatcherService,
  ): StatementMapper {
    if (statementIssuer === 'SWISSCARD') {
      return new SwisscardStatementMapper(context, fileContent, accountId, transactionMatcher);
    }
    if (statementIssuer === 'POSTFINANCE') {
      return new PostFinanceStatementMapper(context, fileContent, accountId, transactionMatcher);
    }
    if (statementIssuer === 'WISE') {
      return new WiseStatementMapper(context, fileContent, accountId, transactionMatcher);
    }
    if (statementIssuer === 'YUH') {
      return new YuhStatementMapper(context, fileContent, accountId, transactionMatcher);
    }
    throw new Error('Invalid statement issuer');
  }
}
