import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../database/drizzle.module';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { StravaModule } from '../strava/strava.module';
import { TrainingEvaluationService } from './training-evaluation.service';
import { BaseTrainingScoringService } from './base-training-scoring.service';
import { BaseCoachingFeedbackService } from './base-coaching-feedback.service';

@Module({
  imports: [DrizzleModule, StravaModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    TrainingEvaluationService,
    BaseTrainingScoringService,
    BaseCoachingFeedbackService,
  ],
})
export class ActivitiesModule {}
