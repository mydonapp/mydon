import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EntryDto } from './entry.dto';

export class PatchTransactionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiProperty({ type: [EntryDto], required: false, description: 'Full replacement entries set' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryDto)
  entries?: EntryDto[];
}
