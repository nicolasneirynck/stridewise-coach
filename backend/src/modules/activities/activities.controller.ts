import { Controller, Post, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { type Session } from '../../common/types/auth';
import {
  ActivityResponseDTO,
  ImportStravaActivitiesResponseDTO,
} from './activities.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getCurrentUserActivities(
    @CurrentUser() user: Session,
  ): Promise<ActivityResponseDTO[]> {
    return this.activitiesService.getActivities(user);
  }

  @Post('import-from-strava')
  async importFromStrava(
    @CurrentUser() user: Session,
  ): Promise<ImportStravaActivitiesResponseDTO> {
    return this.activitiesService.importActivitiesFromStrava(user);
  }
}
