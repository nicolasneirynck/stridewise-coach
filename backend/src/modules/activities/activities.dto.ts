import { Expose } from 'class-transformer';

export class ActivityResponseDTO {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  name: string;

  @Expose()
  startDate: string;

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
