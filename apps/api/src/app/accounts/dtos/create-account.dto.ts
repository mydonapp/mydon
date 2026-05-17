import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { AccountType, Currency } from '../accounts.entity';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'Main Checking Account',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50)
  declare name: string;

  @ApiProperty({
    description: 'Type of account',
    enum: AccountType,
    example: AccountType.ASSETS,
  })
  @IsEnum(AccountType)
  declare type: AccountType;

  @ApiProperty({
    description: 'Opening balance for the account',
    example: 1000.5,
    type: 'number',
  })
  @IsNumber()
  declare openingBalance: number;

  @ApiProperty({
    description: 'Currency for the account',
    enum: Currency,
    example: Currency.CHF,
    required: false,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ description: 'Account group ID', required: false })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty({ description: 'Account code (e.g. SKR03 1200)', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  code?: string;
}
