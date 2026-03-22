import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LoginRequestDTO } from './sessions.dto';
import { AuthResponseDTO } from '../auth/auth-response.dto';
import { AuthDelayInterceptor } from '../auth/interceptors/auth-delay.interceptor';
import { Public } from '../auth/decorators/public.decorator';

// contains public session creation routes
@Controller('sessions')
export class SessionController {
  constructor(private authService: AuthService) {}

  // public session-creation entrypoint
  @UseInterceptors(AuthDelayInterceptor)
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDTO): Promise<AuthResponseDTO> {
    return { token: await this.authService.login(dto) };
  }
}
