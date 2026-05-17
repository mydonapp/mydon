import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EntryDto } from './entry.dto';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Short human description' })
  @IsString()
  declare description: string;

  @ApiProperty({ description: 'External reference / invoice id', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Booking date (ISO 8601)' })
  @IsDateString()
  declare transactionDate: string;

  @ApiProperty({
    type: [EntryDto],
    description: 'At least two entries; sum(DEBIT.baseAmount) must equal sum(CREDIT.baseAmount)',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => EntryDto)
  declare entries: EntryDto[];

  @ApiProperty({
    description: 'When false, transaction is saved as a draft (postedAt = null). Default true.',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  post?: boolean;
}
