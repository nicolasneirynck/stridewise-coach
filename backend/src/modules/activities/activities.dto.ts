import { Expose } from 'class-transformer';
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

export class WeeklyLoadDTO {
  @Expose()
  weekStartDate: string;

  @Expose()
  totalLoad: number;
}

export class RunningActivityAnalysisDTO {
  @Expose()
  id: number;

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
  @IsNumber()
  @Min(0)
  minHeartRate: number;

  @IsNumber()
  @Min(0)
  maxHeartRate: number;
}
