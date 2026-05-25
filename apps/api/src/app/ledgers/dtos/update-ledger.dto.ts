import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { ClosingMode } from '../ledger.entity';

export class UpdateLedgerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({ description: 'Fiscal year start month (1–12)', required: false, minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @ApiProperty({ description: 'Closing mode: SIMPLE (one-click) or ADVANCED (workflow + lock)', required: false, enum: ClosingMode })
  @IsOptional()
  @IsEnum(ClosingMode)
  closingMode?: ClosingMode;

  @ApiProperty({ description: 'Equity account that absorbs closing entries', required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  retainedEarningsAccountId?: string | null;
}
