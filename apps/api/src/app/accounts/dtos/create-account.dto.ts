import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../accounts.entity';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account name',
    example: 'Main Checking Account',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({
    description: 'Type of account',
    enum: AccountType,
    example: AccountType.ASSETS,
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({
    description: 'Opening balance for the account',
    example: 1000.50,
    type: 'number',
  })
  @IsNumber()
  openingBalance: number;
}
