import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DrizzleModule } from '../../database/drizzle.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServerConfig, AuthConfig } from '../../config/configuration';

@Module({
  imports: [
    // This code configures the NestJS JwtModule so your app knows how JWTs should be signed.
    /*
        the app uses JwtService (auth.service -> signJtw)
        JwtService needs configuration
        this block provides that configuration from the env/config system

      registerAsync:
        register the JWT module
        but configure it dynamically at runtime
        using values from ConfigService
     */
    JwtModule.registerAsync({
      inject: [ConfigService], // We injecteren de ConfigService om de configuratie op te halen.
      global: true, // We maken de module ook global zodat we deze niet in andere modules moeten importeren.

      /* build the JWT config object now using ConfigService */
      useFactory: (configService: ConfigService<ServerConfig>) => {
        const authConfig = configService.get<AuthConfig>('auth')!; // We halen onze authenticatie configuratie op.
        return {
          secret: authConfig.jwt.secret, // secret key used to sign the token
          signOptions: {
            expiresIn: `${authConfig.jwt.expirationInterval}s`,
            audience: authConfig.jwt.audience, //who is the token intended for (stridewise-users)
            issuer: authConfig.jwt.issuer, // who created the token (stridewise-api)
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
