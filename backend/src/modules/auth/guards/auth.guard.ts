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
    // We controleren of de route publiek is. Als dat zo is, laten we het request door.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // We halen de JWT uit de Authorization header en controleren of deze bestaat.
    // We gebruiken hiervoor de helper functie extractTokenFromHeader.
    // Deze haalt de token uit de header en controleert of de prefix Bearer is.
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
    return true; // Als alles goed is, laten we het request door
  }

  // We halen de JWT uit de Authorization header en controleren of deze bestaat.
  // Als er geen token is, gooien we een UnauthorizedException.
  // We gebruiken hiervoor de helper functie extractTokenFromHeader.
  // Deze haalt de token uit de header en controleert of de prefix Bearer is.
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
