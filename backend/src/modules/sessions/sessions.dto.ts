import { IsEmail, IsString } from 'class-validator';

export class LoginRequestDTO {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
