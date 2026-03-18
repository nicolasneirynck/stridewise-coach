import { BadRequestException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServerConfig, AuthConfig } from '../../config/configuration';
import { User } from '../../common/types/user';
import { JwtPayload } from '../../common/types/auth';
import { UnauthorizedException } from '@nestjs/common';
import { LoginRequestDTO } from '../sessions/sessions.dto';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { RegisterUserRequestDTO } from '../users/users.dto';
import { Role } from './roles';

@Injectable()
export class AuthService {
  constructor(
    @InjectDrizzle()
    private readonly configService: ConfigService<ServerConfig>,
    private readonly db: DatabaseProvider,
    private readonly jwtService: JwtService,
  ) {}

  async register({
    firstName,
    lastName,
    email,
    password,
  }: RegisterUserRequestDTO): Promise<string> {
    const existingEmail = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingEmail) {
      throw new BadRequestException('This e-mail adress is already in use');
    }

    const passwordHash = await this.hashPassword(password);

    const [newUser] = await this.db
      .insert(users)
      .values({
        passwordHash: passwordHash,
        firstName,
        lastName,
        email,
        roles: [Role.USER],
      })
      .$returningId(); // bv [{ id: 5 }]
    // const [newUser] = result;
    // newUser = { id: 12 }

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, newUser.id),
    });

    // We ondertekenen een JWT en geven deze terug.
    // We weten dat de user bestaat omdat we deze net aangemaakt hebben,
    // dus we gebruiken de non-null assertion operator !
    return this.signJwt(user!);
  }

  async login({ email, password }: LoginRequestDTO): Promise<string> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new UnauthorizedException(
        'The given email and password do not match',
      );
    }

    const passwordValid = await this.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'The given email and password do not match',
      );
    }

    return this.signJwt(user);
  }

  async hashPassword(password: string): Promise<string> {
    const authConfig = this.configService.get<AuthConfig>('auth')!; // We vragen de auth configuratie op.

    return await argon2.hash(password, {
      type: argon2.argon2id,
      hashLength: authConfig.hashLength,
      timeCost: authConfig.timeCost,
      memoryCost: authConfig.memoryCost,
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }

  /* We stoppen het gebruikers id, email en rollen in de JWT payload.
      - Hiervoor gebruiken we de sub claim voor het gebruikers id. 
        Dit is een standaard claim in JWT's.
      - De overige velden zijn custom claims, die mag je zelf kiezen.
      - Let wel op: enkel controle op een rol doen in de frontend is niet voldoende. De backend moet altijd controleren of de gebruiker de actie mag uitvoeren.
      
    De nodige opties mee om de JWT te ondertekenen dienen we niet mee te geven, 
    want reeds doorgegeven bij de registratie van de JwtModule. (AuthModule)*/
  private signJwt(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });
  }

  // functie verifieert de JWT en geeft de payload terug
  async verifyJwt(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return payload;
  }
}
