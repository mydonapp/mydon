import {
  IsDateString,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  creditAmount: number;

  @IsNumber()
  @IsPositive()
  debitAmount: number;

  @IsString()
  description: string;

  @IsUUID()
  creditAccountId: string;

  @IsUUID()
  debitAccountId: string;

  @IsDateString()
  transactionDate: Date;
}
