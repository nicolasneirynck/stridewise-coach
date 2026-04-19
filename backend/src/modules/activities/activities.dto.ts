import { Expose, Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export type ActivityType = 'run' | 'hike' | 'strengthtraining' | 'bike';

export type ActivityTypeFilter =
  | 'all'
  | 'run'
  | 'hike'
  | 'strengthtraining'
  | 'bike';

export class ActivityResponseDTO {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  name: string;

  @Expose()
  type: ActivityType;

  @Expose()
  startDate: string;

  @Expose()
  duration: number;

  @Expose()
  distance: number;

  @Expose()
  sourceActivityId: number | null;

  @Expose()
  source: string;
}

export class ImportStravaActivitiesResponseDTO {
  @Expose()
  fetchedCount: number;

  @Expose()
  importedCount: number;

  @Expose()
  skippedCount: number;
}

export class RunningActivityGraphPointDTO {
  @Expose()
  startDate: string;

  @Expose()
  averagePace: number;

  @Expose()
  averageHeartRate: number | null;
}

export class WeeklyRunningVolumeDTO {
  @Expose()
  weekStartDate: string;

  @Expose()
  totalRunningDistance: number;

  @Expose()
  runCount: number;

  @Expose()
  longestRunDistance: number;
}

export type WeeklyRunningComparisonResult = 'increase' | 'decrease' | 'same';

export class WeeklyRunningProgressionDTO {
  @Expose()
  weekStartDate: string;

  @Expose()
  currentWeekRunningDistance: number;

  @Expose()
  previousWeekRunningDistance: number;

  @Expose()
  percentageDifference: number | null;

  @Expose()
  comparisonResult: WeeklyRunningComparisonResult | null;
}

export class LongestRunProgressionDTO {
  @Expose()
  weekStartDate: string;

  @Expose()
  currentWeekLongestRunDistance: number;

  @Expose()
  previousFourWeekLongestRunBaseline: number | null;

  @Expose()
  percentageDifference: number | null;

  @Expose()
  hasSufficientHistory: boolean;
}

export class IntensityDistributionDTO {
  @Expose()
  weekStartDate: string;

  @Expose()
  lowIntensityCount: number;

  @Expose()
  aboveZoneTwoCount: number;

  @Expose()
  totalCount: number;

  @Expose()
  lowIntensityPercentage: number;

  @Expose()
  aboveZoneTwoPercentage: number;
}

export class RunningActivityAnalysisDTO {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  startDate: string;

  @Expose()
  averageHeartRate: number;

  @Expose()
  averagePace: number;

  @Expose()
  distance: number;

  @Expose()
  duration: number;
}

export class HeartRateIntervalInputDTO {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minHeartRate: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxHeartRate: number;
}
