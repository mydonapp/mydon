import { IsString, IsUUID } from 'class-validator';

export class ImportStatementDto {
  @IsString()
  declare statementIssuer: string;

  @IsUUID()
  declare accountId: string;
}
