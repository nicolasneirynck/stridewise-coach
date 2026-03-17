import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  constructor(private readonly configService: ConfigService) {}

  getAuthorizationUrl(): string {
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
