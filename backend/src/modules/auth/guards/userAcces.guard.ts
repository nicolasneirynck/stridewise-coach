import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '../roles';

@Injectable()
export class CheckUserAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // We controleren of de gebruiker is aangemeld.
    if (!request.user) {
      throw new UnauthorizedException('You need to be signed in');
    }

    const { id: userId, roles } = request.user;
    const id = request.params.id;

    // We controleren of de gebruiker toegang heeft tot de gevraagde gebruiker
    /*
            Als het id 'me' is, heeft de gebruiker altijd toegang.
            Als het id overeenkomt met het id van de aangemelde gebruiker, heeft de gebruiker toegang.
            Als de gebruiker een admin is, heeft hij altijd toegang.
            Anders gooien we een NotFoundException om niet prijs te geven dat de gebruiker bestaat.
     */

    if (id !== 'me' && id !== String(userId) && !roles.includes(Role.ADMIN)) {
      throw new NotFoundException('No user with this id exists');
    }

    return true;
  }
}
