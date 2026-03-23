import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../database/drizzle.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { StravaModule } from '../strava/strava.module';

@Module({
  imports: [DrizzleModule, StravaModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
