import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './modules/health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './database/drizzle.module';
import configuration from './config/configuration';
import { StravaModule } from './modules/strava/strava.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { SessionModule } from './modules/sessions/sessions.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validate: (env) => {
        // so backend crashes early if env is missing or invalid
        if (!env.DATABASE_URL) {
          throw new Error('DATABASE_URL is required');
        }

        if (!env.STRAVA_CLIENT_ID) {
          throw new Error('STRAVA_CLIENT_ID is required');
        }

        if (!env.STRAVA_CLIENT_SECRET) {
          throw new Error('STRAVA_CLIENT_SECRET is required');
        }

        if (!env.STRAVA_REDIRECT_URI) {
          throw new Error('STRAVA_REDIRECT_URI is required');
        }

        try {
          new URL(env.STRAVA_REDIRECT_URI);
        } catch {
          throw new Error('STRAVA_REDIRECT_URI must be a valid URL');
        }

        if (env.FRONTEND_URL) {
          try {
            new URL(env.FRONTEND_URL);
          } catch {
            throw new Error('FRONTEND_URL must be a valid URL');
          }
        }

        if (!env.AUTH_JWT_SECRET) {
          throw new Error('AUTH_JWT_SECRET is required');
        }
        if (!env.AUTH_JWT_AUDIENCE) {
          throw new Error('AUTH_JWT_AUDIENCE is required');
        }
        if (!env.AUTH_JWT_ISSUER) {
          throw new Error('AUTH_JWT_ISSUER is required');
        }

        return env;
      },
    }),
    DrizzleModule,
    AuthModule,
    SessionModule,
    UserModule,
    StravaModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // We registreren de AuthGuard en de RolesGuard globaal. Hierdoor worden deze guard automatisch op alle routes toegepast.
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
