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
  amount: number;

  @IsString()
  description: string;

  @IsUUID()
  creditAccountId: string;

  @IsUUID()
  debitAccountId: string;

  @IsDateString()
  transactionDate: Date;
}
