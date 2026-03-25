import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { StravaService } from './strava.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Session } from '../../common/types/auth';
import {
  StravaActivityResponseDTO,
  StravaConnectionStatusResponseDTO,
} from './strava.dto';

@Controller('strava')
export class StravaController {
  constructor(private readonly stravaService: StravaService) {}

  @Get('connect-url')
  getConnectUrl(@CurrentUser() user: Session) {
    return { url: this.stravaService.getAuthorizationUrl(user.id) };
  }

  @Public()
  @Get('callback') // endpoint that Strava calls after the user clicks Approve or Cancel on the Strava website
  @Redirect()
  async handleCallback(
    @Query('code') code?: string, // read the code value from the URL query string + assign it to the variable code
    @Query('state') state?: string,
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
      const userId = this.stravaService.getUserIdFromOAuthState(state);
      const tokenResponse = await this.stravaService.exchangeCodeForToken(code);
      await this.stravaService.saveConnection(userId, tokenResponse);

      return {
        url: this.stravaService.getFrontendCallbackUrl('success', {
          userId: String(userId),
          athleteId: String(tokenResponse.athlete.id),
        }),
      };
    } catch {
      return {
        url: this.stravaService.getFrontendCallbackUrl('error', {
          reason: 'token_exchange_failed',
        }),
      };
    }
  }

  @Get('connection-status')
  async isCurrentUserConnected(
    @CurrentUser() user: Session,
  ): Promise<StravaConnectionStatusResponseDTO> {
    return this.stravaService.isConnected(user.id);
  }

  @Get('activities')
  async getActivitiesForCurrentUser(
    @CurrentUser() user: Session,
  ): Promise<StravaActivityResponseDTO[]> {
    return this.stravaService.getActivitiesForUser(user.id);
  }
}
