import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Length } from 'class-validator';

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

  @ApiProperty({ description: 'Whether the account is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
