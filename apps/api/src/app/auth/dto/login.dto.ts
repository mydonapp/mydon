import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsEmail()
  @Length(6, 50)
  declare email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @Length(8, 50)
  declare password: string;
}
