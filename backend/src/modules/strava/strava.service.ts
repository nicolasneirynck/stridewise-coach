import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig } from '../../config/configuration';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { strava_connections } from '../../database/schema';
import { sql, eq } from 'drizzle-orm';
import { StravaActivityResponseDTO } from './strava.dto';

interface StravaAthlete {
  id: number;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
}

interface StravaTokenResponse {
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
    private readonly configService: ConfigService,
    @InjectDrizzle() private readonly db: DatabaseProvider,
  ) {}

  getAuthorizationUrl(userId: number): string {
    const clientId = this.configService.getOrThrow<string>('strava.clientId');
    const redirectUri =
      this.configService.getOrThrow<string>('strava.redirectUri');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri, // where Strava should send the user back after approval
      response_type: 'code', //  tells Strava which OAuth flow you want. I say: "I want the authorization code flow", so after approval Strava sends back a short-lived code, and the backend exchanges that code for access and refresh tokens.
      approval_prompt: 'auto', // tells Strava to avoid asking for approval again if possible
      scope: 'read,activity:read_all', // defines what permissions I request, read all means basic read access plus activity access
      state: this.createOAuthState(userId),
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  createOAuthState(userId: number): string {
    const authConfig = this.configService.getOrThrow<AuthConfig>('auth');
    return Buffer.from(`${userId}:${authConfig.jwt.secret}`).toString(
      'base64url',
    ); // -> '42:<my-jwt-secret>'
  } // Buffer.from(...) is being used to turn the plain string into bytes so Node can encode it as base64url
  // They do it because raw strings can contain characters that are awkward in query params, while base64url gives a compact URL-safe value for state
  // This is encoding, not encryption. It hides the string format a little, but anyone who gets the value can decode it. So this does not make the JWT secret “safe to expose” in the OAuth URL. That’s one reason this implementation is not ideal for production.
  // Buffer.from = convert string to bytes
  // toString('base64url') = encode those bytes into a URL-safe string

  getFrontendCallbackUrl(
    // where user goes back in your frontend after backend processing
    status: 'success' | 'error',
    details?: Record<string, string>,
  ): string {
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');
    const url = new URL('/strava/callback', frontendUrl); // TEMPORARY

    url.searchParams.set('status', status);

    if (details) {
      for (const [key, value] of Object.entries(details)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  getUserIdFromOAuthState(state?: string): number {
    if (!state) {
      throw new BadRequestException('Missing Strava OAuth state');
    }

    const authConfig = this.configService.getOrThrow<AuthConfig>('auth');
    const decodedState = Buffer.from(state, 'base64url').toString('utf8');
    const [userId, secret] = decodedState.split(':');

    if (!userId || secret !== authConfig.jwt.secret) {
      throw new BadRequestException('Invalid Strava OAuth state');
    }

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw new BadRequestException('Invalid Strava OAuth state');
    }

    return parsedUserId;
  }

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

  async saveConnection(
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

  async getActivitiesForUser(
    userId: number,
  ): Promise<StravaActivityResponseDTO[]> {
    const stravaConnection = await this.db.query.strava_connections.findFirst({
      where: eq(strava_connections.user_id, userId),
    });

    if (stravaConnection === undefined)
      // findFirst() usually returns undefined when nothing is found
      throw new NotFoundException('Strava connection not found');
    // NotFoundException:
    //  the requested dependent resource is effectively missing: this user has no Strava connection record
    //  it becomes a clear 404
    //  it tells the frontend this is an expected state it can handle

    if (
      stravaConnection.access_token === undefined ||
      stravaConnection.access_token === null ||
      stravaConnection.access_token.trim() === ''
    )
      throw new InternalServerErrorException( // InternalServerErrorException for row exists but token missing/invalid
        'Stored Strava connection is invalid/incomplete',
      );

    const response = await fetch('https://www.strava.com/athlete/activities', {
      method: 'GET',
      headers: { Authorization: `Bearer ${stravaConnection.access_token}` },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `Fetching activities failed: ${response.status} ${errorBody}`,
      );
    }

    // make 100% sure we get a JSON response
    let data: unknown;

    try {
      data = await response.json();
    } catch {
      throw new BadGatewayException('Invalid JSON response from Strava');
    }
    // Why BadGatewayException:
    //    backend is acting as a client to Strava
    //    Strava is the upstream dependency (upstream because we request data from it, dependency because we rely on them)
    //

    // minimal runtime validation -> third party API
    // one malformed item can otherwise crash your endpoint with a vague 500

    if (!Array.isArray(data))
      throw new BadGatewayException('Invalid Strava activities response');

    const activities: StravaActivityResponseDTO[] = data.map((item) => {
      if (item === null || typeof item !== 'object') {
        throw new BadGatewayException('Invalid Strava activity item');
      }

      if (
        !('id' in item) ||
        !('name' in item) ||
        !('sport_type' in item) ||
        !('start_date' in item) ||
        !('distance' in item)
      ) {
        throw new BadGatewayException('Missing fields in Strava activity');
      }

      const { id, name, sport_type, start_date, distance } = item as Record<
        string,
        unknown
      >;

      if (
        typeof id !== 'number' ||
        typeof name !== 'string' ||
        typeof sport_type !== 'string' ||
        typeof start_date !== 'string' ||
        typeof distance !== 'number'
      ) {
        throw new BadGatewayException('Invalid field types in Strava activity');
      }

      return {
        id: String(id),
        name,
        sportType: sport_type,
        startDate: start_date,
        distanceMeters: distance,
      };
    });

    return activities;
  }
}
