import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { StravaService } from './strava.service';

@Controller('strava')
export class StravaController {
  constructor(private readonly stravaService: StravaService) {}

  @Get('connect')
  @Redirect()
  connect() {
    return { url: this.stravaService.getAuthorizationUrl() };
  }

  @Get('callback') // endpoint that Strava calls after the user clicks Approve or Cancel on the Strava website
  @Redirect()
  async handleCallback(
    @Query('code') code?: string, // read the code value from the URL query string + assign it to the variable code
    @Query('scope') _scope?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      return {
        url: this.stravaService.getFrontendCallbackUrl('error', {
          reason: error,
        }),
      };
    }

    if (!code) {
      return {
        url: this.stravaService.getFrontendCallbackUrl('error', {
          reason: 'missing_code',
        }),
      };
    }

    try {
      const tokenResponse = await this.stravaService.exchangeCodeForToken(code);

      // Temporary until user auth is ready:
      // 1. save tokens in strava_connections
      // 2. link to the current user
      return {
        url: this.stravaService.buildFrontendRedirectUrl('success', {
          athleteId: String(tokenResponse.athlete.id),
        }),
      };
    } catch {
      return {
        url: this.stravaService.buildFrontendRedirectUrl('error', {
          reason: 'token_exchange_failed',
        }),
      };
    }
  }
}
