import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // We halen de vereiste rollen op uit de metadata van de route (via de @Roles() decorator).
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Als er geen rollen vereist zijn, laten we het request door.
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // We controleren of de gebruiker is aangemeld.
    if (!request.user) {
      throw new UnauthorizedException('You need to be signed in');
    }

    const { roles } = request.user;
    const hasRole = requiredRoles.some((role) => roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
