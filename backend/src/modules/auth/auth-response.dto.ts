import { IsString } from 'class-validator';

export class AuthResponseDTO {
  @IsString()
  token: string;
}
