import { Expose } from 'class-transformer';

export class StravaActivityResponseDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  sportType: string;

  @Expose()
  startDate: string;

  @Expose()
  distanceMeters: number;
}
