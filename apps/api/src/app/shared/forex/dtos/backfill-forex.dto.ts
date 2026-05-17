import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class BackfillForexDto {
  @ApiProperty({
    description: 'Number of days back from today to backfill. Defaults to 365.',
    required: false,
    minimum: 1,
    maximum: 3650,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  lookbackDays?: number;
}
