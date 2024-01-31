import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { AccountType } from '../accounts.entity';

export class CreateAccountDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsNumber()
  openingBalance: number;
}
