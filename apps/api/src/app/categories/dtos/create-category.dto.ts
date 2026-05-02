import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Food & Dining' })
  @IsString()
  @Length(1, 50)
  name: string;
}
