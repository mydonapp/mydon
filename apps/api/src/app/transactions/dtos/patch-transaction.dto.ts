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
  amount?: number;

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
