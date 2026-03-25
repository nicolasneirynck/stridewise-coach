import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { StravaTokenResponse } from './strava.service';
import { ConfigService } from '@nestjs/config';
import { StravaActivityResponseDTO } from './strava.dto';

@Injectable()
export class StravaApiService {
  constructor(private readonly configService: ConfigService) {}

  async exchangeCodeForToken(code?: string): Promise<StravaTokenResponse> {
    if (!code) {
      throw new BadRequestException('Missing Strava authorization code');
    }

    const clientId = this.configService.getOrThrow<string>('strava.clientId');
    const clientSecret = this.configService.getOrThrow<string>(
      'strava.clientSecret',
    );

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `Strava token exchange failed: ${response.status} ${errorBody}`,
      );
    }

    return (await response.json()) as StravaTokenResponse;
  }

  async refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
    const clientId = this.configService.getOrThrow<string>('strava.clientId');
    const clientSecret = this.configService.getOrThrow<string>(
      'strava.clientSecret',
    );

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `Strava token exchange failed: ${response.status} ${errorBody}`,
      );
    }

    return (await response.json()) as StravaTokenResponse;
  }

  async fetchAthleteActivities(
    accessToken: string,
  ): Promise<StravaActivityResponseDTO[]> {
    const response = await fetch(
      'https://www.strava.com/api/v3/athlete/activities',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `Fetching activities failed: ${response.status} ${errorBody}`,
      );
    }

    let data: unknown;

    try {
      data = await response.json();
    } catch {
      throw new BadGatewayException('Invalid JSON response from Strava');
    }

    if (!Array.isArray(data)) {
      throw new BadGatewayException('Invalid Strava activities response');
    }

    return data.map((item) => {
      if (item === null || typeof item !== 'object') {
        throw new BadGatewayException('Invalid Strava activity item');
      }

      if (
        !('id' in item) ||
        !('name' in item) ||
        !('sport_type' in item) ||
        !('start_date' in item) ||
        !('moving_time' in item) ||
        !('distance' in item)
      ) {
        throw new BadGatewayException('Missing fields in Strava activity');
      }

      const { id, name, sport_type, start_date, moving_time, distance } =
        item as Record<string, unknown>;

      if (
        typeof id !== 'number' ||
        typeof name !== 'string' ||
        typeof sport_type !== 'string' ||
        typeof start_date !== 'string' ||
        typeof moving_time !== 'number' ||
        typeof distance !== 'number'
      ) {
        throw new BadGatewayException('Invalid field types in Strava activity');
      }

      return {
        id: String(id),
        name,
        sportType: sport_type,
        startDate: start_date,
        movingTime: moving_time,
        distanceMeters: distance,
      };
    });
  }
}
