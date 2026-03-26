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
  ActivityType,
  ActivityTypeFilter,
  ImportStravaActivitiesResponseDTO,
  RunningActivityGraphPointDTO,
} from './activities.dto';
import { StravaService } from '../strava/strava.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly stravaService: StravaService,
  ) {}

  async getActivities(
    user: Session,
    filter?: ActivityTypeFilter,
  ): Promise<ActivityResponseDTO[]> {
    const activitiesFilter =
      !filter || filter === 'all'
        ? eq(activities.user_id, user.id)
        : and(
            eq(activities.user_id, user.id),
            eq(activities.activity_type, filter),
          );

    const storedActivities = await this.db.query.activities.findMany({
      where: activitiesFilter,
      orderBy: desc(activities.start_date),
    });

    return storedActivities.map((activity) =>
      this.toActivityResponse(activity),
    );
  }

  async getRunningActivityGraphData(
    user: Session,
  ): Promise<RunningActivityGraphPointDTO[]> {
    const activitiesFilter = and(
      eq(activities.user_id, user.id),
      eq(activities.activity_type, 'run'),
    );

    const storedActivities = await this.db.query.activities.findMany({
      where: activitiesFilter,
      orderBy: desc(activities.start_date),
    });

    return storedActivities
      .filter((activity) => {
        const hasAverageHeartrate =
          activity.average_heartrate !== null &&
          activity.average_heartrate !== undefined &&
          activity.average_heartrate > 0;

        return hasAverageHeartrate;
      })
      .map((activity) => this.toRunningActivityGraphPoint(activity));
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

    if (activityRecords.length > 0) {
      await this.db
        .insert(activities)
        .values(activityRecords)
        .onDuplicateKeyUpdate({
          set: {
            activity_name: sql`values(activity_name)`,
            activity_type: sql`values(activity_type)`,
            start_date: sql`values(start_date)`,
            duration: sql`values(duration)`,
            distance: sql`values(distance)`,
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
    activity_type: ActivityType;
    start_date: Date;
    duration: number;
    distance: number;
    source_activity_id: number | null;
    source: string;
  }): ActivityResponseDTO {
    return {
      id: activity.id,
      userId: activity.user_id,
      name: activity.activity_name,
      type: activity.activity_type,
      startDate: activity.start_date.toISOString(),
      duration: activity.duration,
      distance: activity.distance,
      sourceActivityId: activity.source_activity_id,
      source: activity.source,
    };
  }

  private toRunningActivityGraphPoint(activity: {
    id: number;
    user_id: number;
    activity_name: string;
    activity_type: ActivityType;
    start_date: Date;
    average_heartrate: number | null;
    duration: number;
    distance: number;
    source_activity_id: number | null;
    source: string;
  }): RunningActivityGraphPointDTO {
    const pace = ((activity.duration * 1000) / activity.distance) * 60;

    return {
      startDate: activity.start_date.toISOString(),
      averagePace: pace,
      averageHeartRate: activity.average_heartrate,
    };
  }

  private toStravaActivityRecord(
    activity: {
      id: string;
      name: string;
      sportType: string;
      startDate: string;
      movingTime: number;
      distanceMeters: number;
      averageHeartrate: number | null;
    },
    userId: number,
  ) {
    return {
      user_id: userId,
      activity_name: activity.name,
      activity_type: this.mapSportTypeToActivityType(activity.sportType),
      start_date: new Date(activity.startDate),
      duration: activity.movingTime,
      distance: activity.distanceMeters,
      average_heartrate: activity.averageHeartrate,
      source_activity_id: Number(activity.id),
      source: 'strava' as const,
    };
  }

  private mapSportTypeToActivityType(sportType: string): ActivityType {
    switch (sportType) {
      case 'Run':
      case 'TrailRun':
      case 'VirtualRun':
        return 'run';

      case 'Hike':
      case 'Walk':
      case 'Snowshoe':
        return 'hike';

      case 'Ride':
      case 'EBikeRide':
      case 'VirtualRide':
      case 'MountainBikeRide':
      case 'GravelRide':
      case 'EMountainBikeRide':
      case 'Handcycle':
      case 'Velomobile':
        return 'bike';

      case 'WeightTraining':
      case 'Crossfit':
      case 'HighIntensityIntervalTraining':
      case 'Workout':
        return 'strengthtraining';

      default:
        throw new BadRequestException(`${sportType} is not supported`);
    }
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
