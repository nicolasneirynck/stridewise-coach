import {
  NotFoundException,
  InternalServerErrorException,
  Injectable,
} from '@nestjs/common';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { strava_connections } from '../../database/schema';
import { sql, eq } from 'drizzle-orm';
import {
  StravaActivityResponseDTO,
  StravaConnectionStatusResponseDTO,
} from './strava.dto';
import { StravaApiService } from './strava-api.service';

interface StravaAthlete {
  id: number;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
}

export interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: StravaAthlete;
}

@Injectable()
export class StravaService {
  constructor(
    @InjectDrizzle() private readonly db: DatabaseProvider,
    private readonly stravaApiService: StravaApiService,
  ) {}

  async fetchStravaActivitiesForUser(
    userId: number,
  ): Promise<StravaActivityResponseDTO[]> {
    const stravaConnection = await this.db.query.strava_connections.findFirst({
      where: eq(strava_connections.user_id, userId),
    });

    if (stravaConnection === undefined) {
      throw new NotFoundException('Strava connection not found');
    }

    if (
      stravaConnection.access_token === undefined ||
      stravaConnection.access_token === null ||
      stravaConnection.access_token.trim() === ''
    ) {
      throw new InternalServerErrorException(
        'Stored Strava connection is invalid/incomplete',
      );
    }

    let accessToken = stravaConnection.access_token;

    if (this.isStravaTokenExpired(stravaConnection.expires_at)) {
      if (
        stravaConnection.refresh_token === undefined ||
        stravaConnection.refresh_token === null ||
        stravaConnection.refresh_token.trim() === ''
      ) {
        throw new InternalServerErrorException(
          'Stored Strava refresh token is invalid/incomplete',
        );
      }

      const refreshedTokenResponse =
        await this.stravaApiService.refreshAccessToken(
          stravaConnection.refresh_token,
        );

      await this.updateConnectionTokens(userId, refreshedTokenResponse);
      accessToken = refreshedTokenResponse.access_token;
    }

    return this.stravaApiService.fetchAthleteActivities(accessToken);
  }

  async saveStravaConnection(
    userId: number,
    tokenResponse: StravaTokenResponse,
  ): Promise<void> {
    await this.db
      .insert(strava_connections)
      .values({
        user_id: userId,
        strava_athlete_id: tokenResponse.athlete.id,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: tokenResponse.expires_at,
      })
      .onDuplicateKeyUpdate({
        set: {
          strava_athlete_id: tokenResponse.athlete.id,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_at,
          updated_at: sql`CURRENT_TIMESTAMP`,
        },
      });
  }

  async getStravaConnectionStatus(
    userId: number,
  ): Promise<StravaConnectionStatusResponseDTO> {
    const stravaConnection = await this.db.query.strava_connections.findFirst({
      where: eq(strava_connections.user_id, userId),
    });

    if (stravaConnection === undefined) {
      return { isConnected: false, athleteId: null };
    }

    if (
      stravaConnection.access_token === undefined ||
      stravaConnection.access_token === null ||
      stravaConnection.access_token.trim() === ''
    )
      throw new InternalServerErrorException( // InternalServerErrorException for row exists but token missing/invalid
        'Stored Strava connection is invalid/incomplete',
      );

    return { isConnected: true, athleteId: stravaConnection.strava_athlete_id };
  }

  private async updateConnectionTokens(
    userId: number,
    stravaTokenResponse: StravaTokenResponse,
  ) {
    await this.db
      .update(strava_connections)
      .set({
        access_token: stravaTokenResponse.access_token,
        refresh_token: stravaTokenResponse.refresh_token,
        expires_at: stravaTokenResponse.expires_at,
        updated_at: new Date(),
      })
      .where(eq(strava_connections.user_id, userId));
  }

  private isStravaTokenExpired(expiresAt: number): boolean {
    const nowInSeconds = new Date().getTime() / 1000;
    return expiresAt <= nowInSeconds;
  }

  async connectUserFromAuthorizationCode(
    userId: number,
    code: string,
  ): Promise<StravaTokenResponse> {
    const tokenResponse =
      await this.stravaApiService.exchangeCodeForToken(code);
    await this.saveStravaConnection(userId, tokenResponse);
    return tokenResponse;
  }
}
