import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../database/drizzle.module';
import { StravaController } from './strava.controller';
import { StravaService } from './strava.service';

@Module({
  imports: [DrizzleModule],
  controllers: [StravaController],
  providers: [StravaService],
})
export class StravaModule {}
