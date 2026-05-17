import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length } from 'class-validator';
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

  @ApiProperty({ description: 'ISO 4217 currency (defaults to account currency)', required: false })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({ description: 'FX rate from entry currency to ledger base currency (default 1)', required: false })
  @IsOptional()
  @IsNumber()
  fxRate?: number;

  @ApiProperty({ description: 'Whether this entry was AI-suggested during import', required: false })
  @IsOptional()
  @IsBoolean()
  aiSuggested?: boolean;
}
