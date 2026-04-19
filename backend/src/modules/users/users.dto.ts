import { IsString, MaxLength, IsEmail, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class PublicUserResponseDTO {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  maxHeartRate: number | null;

  @Expose()
  restingHeartRate: number | null;
}

export class RegisterUserRequestDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  lastName: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class UpdateUserRequestDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  lastName: string;

  @IsString()
  @IsEmail()
  email: string;
}
