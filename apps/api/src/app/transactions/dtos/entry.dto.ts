import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Currency } from '../../shared/currency';
import { EntryDirection } from '../entry.entity';

export class EntryDto {
  @ApiProperty({ description: 'Account this entry posts against' })
  @IsUUID()
  declare accountId: string;

  @ApiProperty({ enum: EntryDirection, description: 'DEBIT or CREDIT' })
  @IsEnum(EntryDirection)
  declare direction: EntryDirection;

  @ApiProperty({ description: 'Positive amount in the entry currency' })
  @IsNumber()
  @IsPositive()
  declare amount: number;

  @ApiProperty({ enum: Currency, description: 'Currency (defaults to account currency)', required: false })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ description: 'FX rate from entry currency to ledger base currency (default 1)', required: false })
  @IsOptional()
  @IsNumber()
  fxRate?: number;

  @ApiProperty({ description: 'Whether this entry was AI-suggested during import', required: false })
  @IsOptional()
  @IsBoolean()
  aiSuggested?: boolean;
}
