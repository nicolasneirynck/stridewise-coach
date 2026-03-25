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

export class StravaConnectionStatusResponseDTO {
  @Expose()
  athleteId: number | null;
  @Expose()
  isConnected: boolean;
}
