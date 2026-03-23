import {
  UnauthorizedException,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ServerConfig, AuthConfig } from '../../config/configuration';
import {
  JwtPayload,
  JwtIdentity,
  LoginInput,
  RegisterInput,
} from '../../common/types/auth';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { Role } from '../../common/constans/roles';
@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<ServerConfig>,
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly jwtService: JwtService,
  ) {}

  // public auth flows

  async register({
    firstName,
    lastName,
    email,
    password,
  }: RegisterInput): Promise<string> {
    // Check email availability
    const existingEmail = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingEmail) {
      throw new ConflictException('This e-mail adress is already in use');
    }

    // Prepare credentials
    const passwordHash = await this.hashPassword(password);

    // Create the user
    const [newUser] = await this.db
      .insert(users)
      .values({
        passwordHash: passwordHash,
        firstName,
        lastName,
        email,
        roles: [Role.USER],
      })
      .$returningId();

    // Issue the auth token
    return this.signJwt({ sub: newUser.id, email, roles: [Role.USER] });
  }

  async login({ email, password }: LoginInput): Promise<string> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      this.throwInvalidCredentials();
    }

    const passwordValid = await this.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      this.throwInvalidCredentials();
    }

    return this.signJwt({ sub: user.id, email: user.email, roles: user.roles });
  }

  // public auth infrastructure

  async verifyJwt(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return payload;
  }

  // private implementation details

  private throwInvalidCredentials(): never {
    throw new UnauthorizedException(
      'The given email and password do not match',
    );
  }

  private async hashPassword(password: string): Promise<string> {
    const authConfig = this.configService.get<AuthConfig>('auth')!; // We vragen de auth configuratie op.

    return await argon2.hash(password, {
      type: argon2.argon2id,
      hashLength: authConfig.hashLength,
      timeCost: authConfig.timeCost,
      memoryCost: authConfig.memoryCost,
    });
  }

  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return await argon2.verify(hash, password);
  }

  /* We stoppen het gebruikers id, email en rollen in de JWT payload.
      - Hiervoor gebruiken we de sub claim voor het gebruikers id. 
        Dit is een standaard claim in JWT's.
      - De overige velden zijn custom claims, die mag je zelf kiezen.
      
    De nodige opties mee om de JWT te ondertekenen dienen we niet mee te geven, 
    want reeds doorgegeven bij de registratie van de JwtModule. (AuthModule)*/
  private signJwt({ sub, email, roles }: JwtIdentity): string {
    return this.jwtService.sign({
      sub,
      email,
      roles,
    });
  }
}
