import { BadRequestException, Injectable } from '@nestjs/common';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { activities, users } from '../../database/schema';
import type { Session } from '../../common/types/auth';
import { eq, desc, and, sql, asc } from 'drizzle-orm';
import {
  ActivityResponseDTO,
  ActivityType,
  ActivityTypeFilter,
  HeartRateIntervalInputDTO,
  ImportStravaActivitiesResponseDTO,
  RunningActivityAnalysisDTO,
  RunningActivityGraphPointDTO,
  WeeklyRunningVolumeDTO,
  WeeklyRunningProgressionDTO,
  type WeeklyRunningComparisonResult,
  LongestRunProgressionDTO,
  IntensityDistributionDTO,
  BaseCoachResultDTO,
} from './activities.dto';
import { StravaService } from '../strava/strava.service';
import { TrainingEvaluationService } from './training-evaluation.service';
import { BaseTrainingScoringService } from './base-training-scoring.service';
import { BaseCoachingFeedbackService } from './base-coaching-feedback.service';

type WeeklyRunningVolumeSummary = {
  totalRunningDistance: number;
  runCount: number;
  longestRunDistance: number;
};

const DEFAULT_MAX_HEART_RATE = 190;
const DEFAULT_RESTING_HEART_RATE = 60;

type HeartRateZone = {
  lowerBound: number;
  upperBound: number;
};

type HeartRateZones = {
  zone1: HeartRateZone;
  zone2: HeartRateZone;
  zone3: HeartRateZone;
  zone4: HeartRateZone;
  zone5: HeartRateZone;
};

type UserHeartRateProfile = {
  maxHeartRate: number;
  restingHeartRate: number;
};

type IntensityDistributionSummary = {
  lowIntensityCount: number;
  aboveZoneTwoCount: number;
};

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly stravaService: StravaService,
    private readonly trainingEvaluationService: TrainingEvaluationService,
    private readonly baseTrainingScoringService: BaseTrainingScoringService,
    private readonly baseCoachingFeedbackService: BaseCoachingFeedbackService,
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
    const storedActivities = await this.db.query.activities.findMany({
      where: eq(activities.user_id, user.id),
      orderBy: desc(activities.start_date),
    });

    return this.filterRunningActivitiesWithUsableHeartRate(
      storedActivities,
    ).map((activity) => this.toRunningActivityGraphPoint(activity));
  }

  async getWeeklyRunningVolume(
    user: Session,
  ): Promise<WeeklyRunningVolumeDTO[]> {
    const storedActivities = await this.db.query.activities.findMany({
      columns: { start_date: true, distance: true },
      where: and(
        eq(activities.user_id, user.id),
        eq(activities.activity_type, 'run'),
      ),
    });

    const weeklyVolumes = new Map<string, WeeklyRunningVolumeSummary>();

    for (const activity of storedActivities) {
      const weekStartDate = this.getWeekStartDate(activity.start_date);
      const currentVolume = weeklyVolumes.get(weekStartDate) ?? {
        totalRunningDistance: 0,
        runCount: 0,
        longestRunDistance: 0,
      };

      weeklyVolumes.set(weekStartDate, {
        totalRunningDistance:
          currentVolume.totalRunningDistance + activity.distance,
        runCount: currentVolume.runCount + 1,
        longestRunDistance: Math.max(
          currentVolume.longestRunDistance,
          activity.distance,
        ),
      });
    }

    const sortedWeeks = Array.from(weeklyVolumes.keys()).sort();

    if (sortedWeeks.length === 0) {
      return [];
    }

    return this.fillMissingWeeks(
      sortedWeeks[0],
      sortedWeeks[sortedWeeks.length - 1],
      weeklyVolumes,
    );
  }

  async getWeeklyRunningProgression(
    user: Session,
  ): Promise<WeeklyRunningProgressionDTO[]> {
    const weeklyVolumes = await this.getWeeklyRunningVolume(user);

    return weeklyVolumes.map((weeklyVolume, index) => {
      const previousWeek = index > 0 ? weeklyVolumes[index - 1] : null;

      const currentWeekRunningDistance = weeklyVolume.totalRunningDistance;
      const previousWeekRunningDistance =
        previousWeek?.totalRunningDistance ?? 0;

      const percentageDifference =
        previousWeek === null || previousWeekRunningDistance === 0
          ? null
          : ((currentWeekRunningDistance - previousWeekRunningDistance) /
              previousWeekRunningDistance) *
            100;

      const comparisonResult: WeeklyRunningComparisonResult | null =
        previousWeek === null
          ? null
          : currentWeekRunningDistance > previousWeekRunningDistance
            ? 'increase'
            : currentWeekRunningDistance < previousWeekRunningDistance
              ? 'decrease'
              : 'same';

      return {
        weekStartDate: weeklyVolume.weekStartDate,
        currentWeekRunningDistance,
        previousWeekRunningDistance,
        percentageDifference,
        comparisonResult,
      };
    });
  }

  async getLongestRunProgression(
    user: Session,
  ): Promise<LongestRunProgressionDTO[]> {
    const weeklyVolumes = await this.getWeeklyRunningVolume(user);

    return weeklyVolumes.map((weeklyVolume, index) => {
      const previousFourWeeks =
        index >= 4 ? weeklyVolumes.slice(index - 4, index) : [];

      const hasSufficientHistory = previousFourWeeks.length === 4;
      const previousFourWeekLongestRunBaseline = hasSufficientHistory
        ? Math.max(...previousFourWeeks.map((week) => week.longestRunDistance))
        : null;

      const currentWeekLongestRunDistance = weeklyVolume.longestRunDistance;

      const percentageDifference =
        previousFourWeekLongestRunBaseline === null ||
        previousFourWeekLongestRunBaseline === 0
          ? null
          : ((currentWeekLongestRunDistance -
              previousFourWeekLongestRunBaseline) /
              previousFourWeekLongestRunBaseline) *
            100;

      return {
        weekStartDate: weeklyVolume.weekStartDate,
        currentWeekLongestRunDistance,
        previousFourWeekLongestRunBaseline,
        percentageDifference,
        hasSufficientHistory,
      };
    });
  }

  async getIntensityDistribution(
    user: Session,
  ): Promise<IntensityDistributionDTO[]> {
    const heartRateZones = await this.getUserHeartRateZones(user);
    const zoneTwoUpperBound = heartRateZones.zone2.upperBound;

    const storedActivities = await this.db.query.activities.findMany({
      where: eq(activities.user_id, user.id),
    });

    const runningActivitiesWithHeartRate =
      this.filterRunningActivitiesWithUsableHeartRate(storedActivities);

    const weeklyIntensityDistributions = new Map<
      string,
      IntensityDistributionSummary
    >();

    for (const activity of runningActivitiesWithHeartRate) {
      const weekStartDate = this.getWeekStartDate(activity.start_date);
      const currentDistribution = weeklyIntensityDistributions.get(
        weekStartDate,
      ) ?? {
        lowIntensityCount: 0,
        aboveZoneTwoCount: 0,
      };

      if (
        this.isLowIntensityHeartRate(
          activity.average_heartrate!,
          zoneTwoUpperBound,
        )
      ) {
        currentDistribution.lowIntensityCount += 1;
      } else {
        currentDistribution.aboveZoneTwoCount += 1;
      }

      weeklyIntensityDistributions.set(weekStartDate, currentDistribution);
    }

    if (weeklyIntensityDistributions.size === 0) {
      return [];
    }

    return Array.from(weeklyIntensityDistributions.entries())
      .sort(([firstWeek], [secondWeek]) => firstWeek.localeCompare(secondWeek))
      .map(([weekStartDate, distribution]) =>
        this.toIntensityDistributionResponse(weekStartDate, distribution),
      );
  }

  async getBaseCoachResult(user: Session): Promise<BaseCoachResultDTO> {
    const weeklyRunningProgressions =
      await this.getWeeklyRunningProgression(user);
    const longestRunProgressions = await this.getLongestRunProgression(user);
    const intensityDistributions = await this.getIntensityDistribution(user);

    const componentRatings = [
      this.trainingEvaluationService.evaluateIntensityDistribution(
        intensityDistributions,
      ),
      this.trainingEvaluationService.evaluateWeeklyRunningVolumeProgression(
        weeklyRunningProgressions,
      ),
      this.trainingEvaluationService.evaluateLongestRunProgression(
        longestRunProgressions,
      ),
    ];

    const baseTrainingScore =
      this.baseTrainingScoringService.calculateBaseTrainingScore(
        componentRatings,
      );
    const feedbackMessages = this.baseCoachingFeedbackService.generateFeedback(
      componentRatings,
      {
        intensityDistributions,
        weeklyRunningProgressions,
        longestRunProgressions,
      },
    );

    return {
      analysisPeriod: this.getBaseCoachAnalysisPeriod(
        weeklyRunningProgressions,
      ),
      baseTrainingScore,
      componentRatings,
      feedbackMessages,
    };
  }

  private getBaseCoachAnalysisPeriod(
    weeklyRunningProgressions: WeeklyRunningProgressionDTO[],
  ): BaseCoachResultDTO['analysisPeriod'] {
    const latestWeeklyRunningProgression =
      weeklyRunningProgressions[weeklyRunningProgressions.length - 1];

    if (!latestWeeklyRunningProgression) {
      return null;
    }

    return {
      startDate: latestWeeklyRunningProgression.weekStartDate,
      endDate: this.getWeekEndDate(
        latestWeeklyRunningProgression.weekStartDate,
      ),
    };
  }

  private toIntensityDistributionResponse(
    weekStartDate: string,
    distribution: IntensityDistributionSummary,
  ): IntensityDistributionDTO {
    const totalCount =
      distribution.lowIntensityCount + distribution.aboveZoneTwoCount;

    const lowIntensityPercentage =
      totalCount === 0
        ? 0
        : (distribution.lowIntensityCount / totalCount) * 100;

    const aboveZoneTwoPercentage =
      totalCount === 0
        ? 0
        : (distribution.aboveZoneTwoCount / totalCount) * 100;

    return {
      weekStartDate,
      lowIntensityCount: distribution.lowIntensityCount,
      aboveZoneTwoCount: distribution.aboveZoneTwoCount,
      totalCount,
      lowIntensityPercentage,
      aboveZoneTwoPercentage,
    };
  }

  private async getUserHeartRateProfile(
    user: Session,
  ): Promise<UserHeartRateProfile> {
    const storedUser = await this.db.query.users.findFirst({
      columns: { maxHeartRate: true, restingHeartRate: true },
      where: eq(users.id, user.id),
    });

    return {
      maxHeartRate: storedUser?.maxHeartRate ?? DEFAULT_MAX_HEART_RATE,
      restingHeartRate:
        storedUser?.restingHeartRate ?? DEFAULT_RESTING_HEART_RATE,
    };
  }

  private async getUserHeartRateZones(user: Session): Promise<HeartRateZones> {
    const heartRateProfile = await this.getUserHeartRateProfile(user);

    return this.calculateHeartRateZones(
      heartRateProfile.maxHeartRate,
      heartRateProfile.restingHeartRate,
    );
  }

  private calculateHeartRateZones(
    maxHeartRate: number,
    restingHeartRate: number,
  ): HeartRateZones {
    const heartRateReserve = maxHeartRate - restingHeartRate;

    const calculateBoundary = (percentage: number): number =>
      Math.round(restingHeartRate + heartRateReserve * percentage);

    return {
      zone1: {
        lowerBound: calculateBoundary(0.5),
        upperBound: calculateBoundary(0.6),
      },
      zone2: {
        lowerBound: calculateBoundary(0.6),
        upperBound: calculateBoundary(0.7),
      },
      zone3: {
        lowerBound: calculateBoundary(0.7),
        upperBound: calculateBoundary(0.8),
      },
      zone4: {
        lowerBound: calculateBoundary(0.8),
        upperBound: calculateBoundary(0.9),
      },
      zone5: {
        lowerBound: calculateBoundary(0.9),
        upperBound: calculateBoundary(1),
      },
    };
  }

  private getWeekStartDate(date: Date): string {
    const weekStart = new Date(date);
    const day = weekStart.getUTCDay();
    const daysSinceMonday = (day + 6) % 7;

    weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    return weekStart.toISOString().slice(0, 10);
  }

  private getWeekEndDate(weekStartDate: string): string {
    const weekEnd = new Date(`${weekStartDate}T00:00:00.000Z`);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    return weekEnd.toISOString().slice(0, 10);
  }

  private fillMissingWeeks(
    firstWeek: string,
    lastWeek: string,
    weeklyVolumes: Map<string, WeeklyRunningVolumeSummary>,
  ): WeeklyRunningVolumeDTO[] {
    const result: WeeklyRunningVolumeDTO[] = [];

    for (
      const currentWeek = new Date(`${firstWeek}T00:00:00.000Z`);
      currentWeek <= new Date(`${lastWeek}T00:00:00.000Z`);
      currentWeek.setUTCDate(currentWeek.getUTCDate() + 7)
    ) {
      const weekStartDate = currentWeek.toISOString().slice(0, 10);
      const weeklyVolume = weeklyVolumes.get(weekStartDate) ?? {
        totalRunningDistance: 0,
        runCount: 0,
        longestRunDistance: 0,
      };

      result.push({
        weekStartDate,
        totalRunningDistance: weeklyVolume.totalRunningDistance,
        runCount: weeklyVolume.runCount,
        longestRunDistance: weeklyVolume.longestRunDistance,
      });
    }

    return result;
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
            average_heartrate: sql`values(average_heartrate)`,
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

  async getRunningActivitiesInTargetHeartRateRange(
    user: Session,
    interval: HeartRateIntervalInputDTO,
  ): Promise<RunningActivityAnalysisDTO[]> {
    if (interval.minHeartRate > interval.maxHeartRate) {
      throw new BadRequestException(
        'Minimum heartrate should be lower than maximum heartrate',
      );
    }

    const storedActivities = await this.db.query.activities.findMany({
      where: eq(activities.user_id, user.id),
      orderBy: asc(activities.start_date),
    });

    return this.filterRunningActivitiesInTargetHeartRateRange(
      storedActivities,
      interval,
    ).map((activity) => this.toRunningActivityAnalysis(activity));
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
    const paceInSecondsPerKilometer =
      activity.duration / (activity.distance / 1000);

    return {
      startDate: activity.start_date.toISOString(),
      averagePace: paceInSecondsPerKilometer,
      averageHeartRate: activity.average_heartrate,
    };
  }

  private toRunningActivityAnalysis(activity: {
    id: number;
    activity_name: string;
    start_date: Date;
    average_heartrate: number | null;
    duration: number;
    distance: number;
  }): RunningActivityAnalysisDTO {
    const paceInSecondsPerKilometer =
      activity.duration / (activity.distance / 1000);

    return {
      id: activity.id,
      name: activity.activity_name,
      startDate: activity.start_date.toISOString(),
      averageHeartRate: activity.average_heartrate!,
      averagePace: paceInSecondsPerKilometer,
      distance: activity.distance,
      duration: activity.duration,
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

  private filterRunningActivitiesWithUsableHeartRate(
    activities: {
      duration: number;
      id: number;
      user_id: number;
      activity_name: string;
      activity_type: ActivityType;
      start_date: Date;
      distance: number;
      average_heartrate: number | null;
      source_activity_id: number | null;
      source: string;
      created_at: Date;
      updated_at: Date;
    }[],
  ) {
    return activities.filter((activity) => {
      const hasAverageHeartrate =
        activity.average_heartrate !== null &&
        activity.average_heartrate !== undefined &&
        activity.average_heartrate > 0;

      return hasAverageHeartrate && activity.activity_type === 'run';
    });
  }

  private isHeartRateInTargetRange(
    heartRate: number,
    minHeartRate: number,
    maxHeartRate: number,
  ): boolean {
    return heartRate >= minHeartRate && heartRate <= maxHeartRate;
  }

  private isLowIntensityHeartRate(
    averageHeartRate: number,
    zoneTwoUpperBound: number,
  ): boolean {
    return averageHeartRate <= zoneTwoUpperBound;
  }

  private filterRunningActivitiesInTargetHeartRateRange(
    activities: {
      duration: number;
      id: number;
      user_id: number;
      activity_name: string;
      activity_type: ActivityType;
      start_date: Date;
      distance: number;
      average_heartrate: number | null;
      source_activity_id: number | null;
      source: string;
      created_at: Date;
      updated_at: Date;
    }[],
    interval: HeartRateIntervalInputDTO,
  ) {
    return this.filterRunningActivitiesWithUsableHeartRate(activities).filter(
      (activity) =>
        this.isHeartRateInTargetRange(
          activity.average_heartrate!,
          interval.minHeartRate,
          interval.maxHeartRate,
        ),
    );
  }
}
