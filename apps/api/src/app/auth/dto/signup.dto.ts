import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { OrganizationKind } from '../../organizations/organization.entity';

export class SignupDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50)
  declare name: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @Length(8, 50)
  declare password: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsEmail()
  @Length(6, 50)
  declare email: string;

  @ApiProperty({ description: 'Organization kind to provision', required: false, enum: OrganizationKind })
  @IsOptional()
  @IsEnum(OrganizationKind)
  declare kind?: OrganizationKind;

  @ApiProperty({ description: 'Organization name (required for BUSINESS signups)', required: false })
  @ValidateIf((o) => o.kind === OrganizationKind.BUSINESS)
  @IsString()
  @Length(2, 100)
  declare organizationName?: string;
}
