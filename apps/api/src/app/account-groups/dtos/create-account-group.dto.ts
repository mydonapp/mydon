import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAccountGroupDto {
  @ApiProperty({ description: 'Account group name', example: 'Operating Expenses' })
  @IsString()
  @Length(1, 50)
  declare name: string;

  @ApiProperty({ description: 'Account group code (e.g. SKR03 4xxx)', example: '4000', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  declare code?: string;

  @ApiProperty({ description: 'Parent group id', required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare parentId?: string | null;
}
