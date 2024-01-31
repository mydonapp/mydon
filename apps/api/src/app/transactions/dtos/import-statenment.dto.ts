import { IsString, IsUUID } from 'class-validator';

export class ImportStatementDto {
  @IsString()
  statementIssuer: string;

  @IsUUID()
  accountId: string;
}
