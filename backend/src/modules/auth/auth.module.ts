import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DrizzleModule } from '../../database/drizzle.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServerConfig, AuthConfig } from '../../config/configuration';

@Module({
  imports: [
    // We importeren de JwtModule en configureren deze asynchroon met onze AuthConfig.
    JwtModule.registerAsync({
      inject: [ConfigService], // We injecteren de ConfigService om de configuratie op te halen.
      global: true, // We maken de module ook global zodat we deze niet in andere modules moeten importeren.
      useFactory: (configService: ConfigService<ServerConfig>) => {
        const authConfig = configService.get<AuthConfig>('auth')!; // We halen onze authenticatie configuratie op.

        // We geven de nodige opties mee aan de JwtModule, opgehaald uit onze configuratie:
        //    - secret: het geheim waarmee de JWT ondertekend wordt
        //    - signOptions: opties voor het ondertekenen van de JWT, zoals vervaldatum, audience en issuer
        return {
          secret: authConfig.jwt.secret,
          signOptions: {
            expiresIn: `${authConfig.jwt.expirationInterval}s`,
            audience: authConfig.jwt.audience,
            issuer: authConfig.jwt.issuer,
          },
        };
      },
    }),
    DrizzleModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
