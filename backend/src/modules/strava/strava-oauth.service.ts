import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig } from '../../config/configuration';

@Injectable()
export class StravaOAuthService {
  constructor(private readonly configService: ConfigService) {}

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

  getFrontendStravaErrorUrl(reason: string): string {
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');
    const url = new URL('/strava/callback', frontendUrl);

    url.searchParams.set('reason', reason);

    return url.toString();
  }

  getFrontendStravaPageUrl() {
    const frontendUrl = this.configService.getOrThrow<string>('frontendUrl');
    return new URL('/strava', frontendUrl).toString();
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
}
