import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { StravaService } from './strava.service';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import type { Session } from '../../common/types/auth';

@Controller('strava')
export class StravaController {
  constructor(private readonly stravaService: StravaService) {}

  @Get('connect')
  @Redirect()
  connect(@CurrentUser() user: Session) {
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
}
