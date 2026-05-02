import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ description: 'Budget name', example: 'Conservative 2026' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Budget year', example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
