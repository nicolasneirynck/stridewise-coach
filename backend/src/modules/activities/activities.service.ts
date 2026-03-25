import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { activities } from '../../database/schema';
import type { Session } from '../../common/types/auth';
import { eq, desc, and, sql } from 'drizzle-orm';
import {
  ActivityResponseDTO,
  ImportStravaActivitiesResponseDTO,
} from './activities.dto';
import { StravaService } from '../strava/strava.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly stravaService: StravaService,
  ) {}

  async getActivities(user: Session): Promise<ActivityResponseDTO[]> {
    const storedActivities = await this.db.query.activities.findMany({
      where: eq(activities.user_id, user.id),
      orderBy: desc(activities.start_date),
    });

    return storedActivities.map((activity) =>
      this.toActivityResponse(activity),
    );
  }

  async syncStravaActivitiesForUser(
    user: Session,
  ): Promise<ImportStravaActivitiesResponseDTO> {
    const stravaActivities =
      await this.stravaService.fetchStravaActivitiesForUser(user.id);

    const activityRecords = stravaActivities.map((activity) =>
      this.toStravaActivityRecord(activity, user.id),
    );

    this.validateActivityRecords(activityRecords);

    const existingSourceIds = await this.getExistingStravaActivityIds(user.id);

    const newActivityRecords = activityRecords.filter(
      (activity) => !existingSourceIds.has(activity.source_activity_id),
    );

    if (newActivityRecords.length > 0) {
      await this.db
        .insert(activities)
        .values(newActivityRecords)
        .onDuplicateKeyUpdate({
          set: {
            updated_at: sql`CURRENT_TIMESTAMP`,
          },
        });
    }

    return {
      fetchedCount: stravaActivities.length,
      importedCount: newActivityRecords.length,
      skippedCount: stravaActivities.length - newActivityRecords.length,
    };
  }

  private toActivityResponse(activity: {
    id: number;
    user_id: number;
    activity_name: string;
    start_date: Date;
    distance: number;
    source_activity_id: number | null;
    source: string;
  }): ActivityResponseDTO {
    return {
      id: activity.id,
      userId: activity.user_id,
      name: activity.activity_name,
      startDate: activity.start_date.toISOString(),
      distance: activity.distance,
      sourceActivityId: activity.source_activity_id,
      source: activity.source,
    };
  }

  private toStravaActivityRecord(
    activity: {
      id: string;
      name: string;
      startDate: string;
      distanceMeters: number;
    },
    userId: number,
  ) {
    return {
      user_id: userId,
      activity_name: activity.name,
      start_date: new Date(activity.startDate),
      distance: activity.distanceMeters,
      source_activity_id: Number(activity.id),
      source: 'strava' as const,
    };
  }

  private validateActivityRecords(
    activityRecords: Array<{ start_date: Date }>,
  ): void {
    for (const activity of activityRecords) {
      if (Number.isNaN(activity.start_date.getTime())) {
        throw new BadRequestException('Invalid activity start date');
      }
    }
  }

  private async getExistingStravaActivityIds(
    userId: number,
  ): Promise<Set<number | null>> {
    const existingIds = await this.db
      .selectDistinct({ id: activities.source_activity_id })
      .from(activities)
      .where(
        and(eq(activities.user_id, userId), eq(activities.source, 'strava')),
      );

    return new Set(existingIds.map((activity) => activity.id));
  }
}
