import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { StravaService } from './strava.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Session } from '../../common/types/auth';
import {
  StravaActivityResponseDTO,
  StravaConnectionStatusResponseDTO,
} from './strava.dto';
import { StravaOAuthService } from './strava-oauth.service';

@Controller('strava')
export class StravaController {
  constructor(
    private readonly stravaService: StravaService,
    private readonly stravaOAuthService: StravaOAuthService,
  ) {}

  @Get('connect-url')
  getConnectUrl(@CurrentUser() user: Session) {
    return { url: this.stravaOAuthService.getAuthorizationUrl(user.id) };
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
        url: this.stravaOAuthService.getFrontendStravaErrorUrl(error),
      };
    }

    if (!code) {
      return {
        url: this.stravaOAuthService.getFrontendStravaErrorUrl('missing_code'),
      };
    }

    try {
      const userId = this.stravaOAuthService.getUserIdFromOAuthState(state);
      await this.stravaService.connectUserFromAuthorizationCode(userId, code);

      return {
        url: this.stravaOAuthService.getFrontendStravaPageUrl(),
      };
    } catch {
      return {
        url: this.stravaOAuthService.getFrontendStravaErrorUrl(
          'token_exchange_failed',
        ),
      };
    }
  }

  @Get('connection-status')
  async getCurrentUserStravaConnectionStatus(
    @CurrentUser() user: Session,
  ): Promise<StravaConnectionStatusResponseDTO> {
    return this.stravaService.getStravaConnectionStatus(user.id);
  }

  @Get('activities')
  async getCurrentUserStravaActivities(
    @CurrentUser() user: Session,
  ): Promise<StravaActivityResponseDTO[]> {
    return this.stravaService.fetchStravaActivitiesForUser(user.id);
  }
}
