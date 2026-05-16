import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Opening balance', required: false })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiProperty({ description: 'Whether the account is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Account number for sorting and identification', required: false })
  @IsOptional()
  @IsNumber()
  accountNumber?: number | null;
}
