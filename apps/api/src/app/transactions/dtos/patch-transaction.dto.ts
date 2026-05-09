import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class PatchTransactionDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  declare debitAmount?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  declare creditAmount?: number;

  @IsString()
  @IsOptional()
  declare description?: string;

  @IsUUID()
  @IsOptional()
  declare creditAccountId?: string;

  @IsUUID()
  @IsOptional()
  declare debitAccountId?: string;

  @IsBoolean()
  @IsOptional()
  declare draft?: boolean;
}
