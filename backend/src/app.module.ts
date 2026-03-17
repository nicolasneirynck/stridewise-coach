import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './modules/health/health.controller';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './database/drizzle.module';
import configuration from './config/configuration';
import { StravaModule } from './modules/strava/strava.module';

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

        return env;
      },
    }),
    DrizzleModule,
    StravaModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
