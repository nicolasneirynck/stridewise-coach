import { Controller, Post, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { type Session } from '../../common/types/auth';
import {
  ActivityResponseDTO,
  type ActivityTypeFilter,
  HeartRateIntervalInputDTO,
  ImportStravaActivitiesResponseDTO,
  RunningActivityAnalysisDTO,
  RunningActivityGraphPointDTO,
  WeeklyRunningVolumeDTO,
  BaseCoachResultDTO,
} from './activities.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getCurrentUserActivities(
    @CurrentUser() user: Session,
    @Query('type') filter?: ActivityTypeFilter,
  ): Promise<ActivityResponseDTO[]> {
    return this.activitiesService.getActivities(user, filter);
  }

  @Get('running-graph')
  async getCurrentUserRunningGraphData(
    @CurrentUser() user: Session,
  ): Promise<RunningActivityGraphPointDTO[]> {
    return this.activitiesService.getRunningActivityGraphData(user);
  }

  @Get('weekly-running-volume')
  async getWeeklyRunningVolume(
    @CurrentUser() user: Session,
  ): Promise<WeeklyRunningVolumeDTO[]> {
    return this.activitiesService.getWeeklyRunningVolume(user);
  }

  @Get('base-coach-result')
  async getBaseCoachResult(
    @CurrentUser() user: Session,
  ): Promise<BaseCoachResultDTO> {
    return this.activitiesService.getBaseCoachResult(user);
  }

  @Get('running-activities/target-heart-rate')
  async getCurrentUserRunningActivitiesInTargetHeartRate(
    @CurrentUser() user: Session,
    @Query() interval: HeartRateIntervalInputDTO,
  ): Promise<RunningActivityAnalysisDTO[]> {
    return this.activitiesService.getRunningActivitiesInTargetHeartRateRange(
      user,
      interval,
    );
  }

  @Post('import-from-strava')
  async syncStravaActivities(
    @CurrentUser() user: Session,
  ): Promise<ImportStravaActivitiesResponseDTO> {
    return this.activitiesService.syncStravaActivitiesForUser(user);
  }
}
