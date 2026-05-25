import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CloseFiscalYearDto {
  @ApiProperty({ description: 'Fiscal year start year (e.g. 2025 for FY 2025/26 if fiscalYearStartMonth ≠ 1)' })
  @IsInt()
  @Min(1900)
  @Max(2200)
  fiscalYearStartYear!: number;
}
