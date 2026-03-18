import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig } from '../../config/configuration';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../../database/drizzle.provider';
import { strava_connections } from '../../database/schema';
import { sql } from 'drizzle-orm';

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
    //  where user goes to Strava
    const clientId = this.configService.getOrThrow<string>('strava.clientId');
    const redirectUri =
      this.configService.getOrThrow<string>('strava.redirectUri');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri, // where Strava should send the user back after approval
      response_type: 'code', // tells Strava I want an authorization code, that code will later be exchanged for tokens
      approval_prompt: 'auto', // tells Strava to avoid asking for approval again if possible
      scope: 'read,activity:read_all', // defines what permissions I request, read all means basic read access plus activity access
      state: this.createOAuthState(userId),
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
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

  createOAuthState(userId: number): string {
    const authConfig = this.configService.getOrThrow<AuthConfig>('auth');
    return Buffer.from(`${userId}:${authConfig.jwt.secret}`).toString(
      'base64url',
    );
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
}
