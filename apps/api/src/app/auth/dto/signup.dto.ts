import { IsEmail, IsString, Length } from 'class-validator';

export class SignupDto {
  @IsString()
  @Length(3, 50)
  name: string;

  @IsString()
  @Length(8, 50)
  password: string;

  @IsString()
  @IsEmail()
  @Length(6, 50)
  email: string;
}
