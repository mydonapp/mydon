import {
  SwisscardStatement,
  SwisscardStatementMapper,
} from './swisscard-statement.mapper';

type StatementMapper = SwisscardStatementMapper;
export type Statement = SwisscardStatement;

export class StatementMapperFactory {
  constructor() {
    throw new Error('Cannot instantiate factory');
  }

  static create(
    statement: Statement[],
    statementIssuer,
    accountId: string
  ): StatementMapper {
    if (statementIssuer === 'SWISSCARD') {
      return new SwisscardStatementMapper(statement, accountId);
    }
    throw new Error('Invalid statement issuer');
  }
}
