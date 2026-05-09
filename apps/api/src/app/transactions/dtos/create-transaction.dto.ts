import { IsDateString, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  declare creditAmount: number;

  @IsNumber()
  @IsPositive()
  declare debitAmount: number;

  @IsString()
  declare description: string;

  @IsUUID()
  declare creditAccountId: string;

  @IsUUID()
  declare debitAccountId: string;

  @IsDateString()
  declare transactionDate: Date;
}
