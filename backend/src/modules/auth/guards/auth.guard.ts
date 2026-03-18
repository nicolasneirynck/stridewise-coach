// src/auth/guards/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector, // We injecteren de Reflector om metadata van decorators te kunnen lezen
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // does this route if not, does the controller class have it?
      context.getClass(), // if not, does the controller class have it?
    ]);
    if (isPublic) {
      return true;
    }

    // We halen de JWT uit de Authorization header en controleren of deze bestaat.
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('You need to be signed in');
    }

    try {
      const payload = await this.authService.verifyJwt(token);

      // We slaan de gebruikersinformatie op in request.user zodat we deze later kunnen gebruiken.
      request.user = {
        id: payload.sub,
        roles: payload.roles,
        email: payload.email,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
    return true;
  }

  // Deze haalt de token uit de header en controleert of de prefix Bearer is.
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
