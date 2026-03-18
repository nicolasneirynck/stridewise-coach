import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LoginRequestDTO, LoginResponseDTO } from './sessions.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('sessions')
export class SessionController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() loginDto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const token = await this.authService.login(loginDto);
    return { token }; // We geven de JWT token terug in een object.
  }
}
