import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig } from '../../config/configuration';
import { createHmac, timingSafeEqual } from 'crypto';

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

  private createOAuthState(userId: number): string {
    const payload = String(userId);
    const signature = this.signOAuthStatePayload(payload);

    return `${payload}.${signature}`;
  }

  private signOAuthStatePayload(payload: string): string {
    const authConfig = this.getAuthConfig();

    return createHmac('sha256', authConfig.jwt.secret)
      .update(payload)
      .digest('base64url');
  }

  getFrontendStravaErrorUrl(reason: string): string {
    const frontendUrl = this.getFrontendUrl();
    const url = new URL('/strava/callback', frontendUrl);

    url.searchParams.set('reason', reason);

    return url.toString();
  }

  getFrontendStravaPageUrl() {
    const frontendUrl = this.getFrontendUrl();
    return new URL('/strava', frontendUrl).toString();
  }

  getUserIdFromOAuthState(state?: string): number {
    if (!state) {
      throw new BadRequestException('Missing Strava OAuth state');
    }

    const [payload, signature] = state.split('.');

    if (!payload || !signature) {
      throw new BadRequestException('Invalid Strava OAuth state');
    }

    const expectedSignature = this.signOAuthStatePayload(payload);

    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new BadRequestException('Invalid Strava OAuth state');
    }

    const parsedUserId = Number(payload);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      throw new BadRequestException('Invalid Strava OAuth state');
    }

    return parsedUserId;
  }

  private getFrontendUrl(): string {
    return this.configService.getOrThrow<string>('frontendUrl');
  }

  private getAuthConfig(): AuthConfig {
    return this.configService.getOrThrow<AuthConfig>('auth');
  }
}
