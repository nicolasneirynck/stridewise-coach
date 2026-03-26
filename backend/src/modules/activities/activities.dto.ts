import { Expose } from 'class-transformer';

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
