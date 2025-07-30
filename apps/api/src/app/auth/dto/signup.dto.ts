import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @Length(8, 50)
  password: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsEmail()
  @Length(6, 50)
  email: string;
}
