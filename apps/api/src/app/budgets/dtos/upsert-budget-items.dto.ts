import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { BudgetFrequency } from '../budget-item.entity';

export class BudgetItemDto {
  @ApiProperty({ description: 'Account ID (if account-level item)', required: false })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ description: 'Category ID (if category-level item)', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Budget amount', example: 500 })
  @IsNumber()
  @Min(0)
  declare amount: number;

  @ApiProperty({ enum: BudgetFrequency, description: 'Whether the amount is monthly or yearly' })
  @IsEnum(BudgetFrequency)
  declare frequency: BudgetFrequency;
}

export class UpsertBudgetItemsDto {
  @ApiProperty({ type: [BudgetItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  declare items: BudgetItemDto[];
}
