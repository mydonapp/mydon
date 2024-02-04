import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class PatchTransactionDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  debitAmount?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  creditAmount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  creditAccountId?: string;

  @IsUUID()
  @IsOptional()
  debitAccountId?: string;

  @IsBoolean()
  @IsOptional()
  draft?: boolean;
}
