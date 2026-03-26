import { Controller, Post, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { type Session } from '../../common/types/auth';
import {
  ActivityResponseDTO,
  type ActivityTypeFilter,
  ImportStravaActivitiesResponseDTO,
  RunningActivityGraphPointDTO,
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

  @Post('import-from-strava')
  async syncStravaActivities(
    @CurrentUser() user: Session,
  ): Promise<ImportStravaActivitiesResponseDTO> {
    return this.activitiesService.syncStravaActivitiesForUser(user);
  }
}
