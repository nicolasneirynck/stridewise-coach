import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../database/drizzle.module';
import { StravaController } from './strava.controller';
import { StravaService } from './strava.service';
import { StravaOAuthService } from './strava-oauth.service';
import { StravaApiService } from './strava-api.service';

@Module({
  imports: [DrizzleModule],
  controllers: [StravaController],
  providers: [StravaService, StravaOAuthService, StravaApiService],
  exports: [StravaService],
})
export class StravaModule {}
