import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from 'class-validator';
import { BudgetFrequency } from '../budget-frequency.enum';

export class BudgetSubItemDto {
  @ApiProperty({ description: 'Sub-item name', example: 'Netflix' })
  @IsString()
  @Length(1, 100)
  declare name: string;

  @ApiProperty({ description: 'Sub-item price, expressed in the frequency unit', example: 18.9 })
  @IsNumber()
  @Min(0)
  declare amount: number;

  @ApiProperty({ enum: BudgetFrequency, description: 'Whether the price is monthly or yearly' })
  @IsEnum(BudgetFrequency)
  declare frequency: BudgetFrequency;
}

export class BudgetItemDto {
  @ApiProperty({ description: 'Account ID (if account-level item)', required: false })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ description: 'Account group ID (if group-level item)', required: false })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty({ description: 'Budget amount', example: 500 })
  @IsNumber()
  @Min(0)
  declare amount: number;

  @ApiProperty({ enum: BudgetFrequency, description: 'Whether the amount is monthly or yearly' })
  @IsEnum(BudgetFrequency)
  declare frequency: BudgetFrequency;

  @ApiProperty({
    type: [BudgetSubItemDto],
    required: false,
    description: 'Optional breakdown. When present the server derives `amount` from these and ignores the sent amount.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetSubItemDto)
  subItems?: BudgetSubItemDto[];
}

export class UpsertBudgetItemsDto {
  @ApiProperty({ type: [BudgetItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  declare items: BudgetItemDto[];
}
