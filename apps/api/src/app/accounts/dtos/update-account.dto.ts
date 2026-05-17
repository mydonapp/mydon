import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateAccountDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;

  @ApiProperty({ description: 'Account group ID', required: false })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty({ description: 'Account code (e.g. SKR03 1200)', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  code?: string;

  @ApiProperty({ description: 'Activity window start (null = since creation)', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  activeFrom?: string | null;

  @ApiProperty({ description: 'Activity window end (null = no scheduled end)', required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  activeUntil?: string | null;
}
