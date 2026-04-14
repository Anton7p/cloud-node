import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateUserResult, MarzbanUserResponse } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import { MarzbanApiClient } from './marzban-api-client.service';

@Injectable()
export class MarzbanUserService {
  private readonly logger = new Logger(MarzbanUserService.name);
  private readonly domainName: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly apiClient: MarzbanApiClient,
  ) {
    this.domainName =
      this.configService.get<AppConfig['domainName']>('app.domainName');
  }

  /**
   * Create a new user in Marzban with traffic limit and expiry
   * For trial accounts (months <= 0.1), sets limitIp to 2 devices
   */
  async createUser(
    telegramId: string,
    months: number,
  ): Promise<CreateUserResult> {
    try {
      const username = `user_${telegramId}`;
      const daysPerMonth = this.configService.get<
        AppConfig['subscriptionDaysPerMonth']
      >('app.subscriptionDaysPerMonth');
      const expireDays = months * daysPerMonth;
      const dataLimit = this.configService.get<AppConfig['defaultDataLimit']>(
        'app.defaultDataLimit',
      );
      const expireTimestamp = Math.floor(
        (Date.now() + expireDays * 24 * 60 * 60 * 1000) / 1000,
      );

      // Trial account detection: months <= 0.1 (approximately 3 days or less)
      const isTrialAccount = months <= 0.1;
      const limitIp = isTrialAccount ? 2 : undefined;

      this.logger.log(
        `Creating Marzban user ${username} with ${months} months subscription` +
          (isTrialAccount ? ' (TRIAL - limitIp: 2)' : ''),
      );

      // Get inbound tag from config (default: VLESS_REALITY)
      const inboundTag =
        this.configService.get<AppConfig['marzbanInboundTag']>(
          'app.marzbanInboundTag',
        ) || 'VLESS_REALITY';

      const requestBody: Record<string, unknown> = {
        username,
        expire: expireTimestamp,
        data_limit: dataLimit,
        status: 'active',
        proxies: {
          vless: {
            id: inboundTag,
          },
        },
      };

      // Add limitIp for trial accounts
      if (limitIp) {
        requestBody.limitIp = limitIp;
      }

      const response = await this.apiClient
        .getAxiosInstance()
        .post<MarzbanUserResponse>('/user', requestBody);

      if (response.data.subscription_url || response.data.username) {
        // Always build subscription URL using DOMAIN_NAME
        const subscriptionUrl = this.buildSubscriptionUrl(
          response.data.username,
        );

        this.logger.log(
          `User ${response.data.username} created successfully with subscription URL`,
        );

        return {
          success: true,
          subscriptionUrl,
          username: response.data.username,
        };
      }

      this.logger.error('Failed to create user: no subscription URL returned');
      return {
        success: false,
        error: 'No subscription URL returned from Marzban',
      };
    } catch (error) {
      const userNameForError = `user_${telegramId}`;
      // Handle 409 Conflict - user already exists, treat as success
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        this.logger.log(
          `User ${userNameForError} already exists, returning existing user data`,
        );
        return {
          success: true,
          subscriptionUrl: this.buildSubscriptionUrl(userNameForError),
          username: userNameForError,
        };
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired, try to re-login and retry once
        this.logger.log('Token expired, re-authenticating...');
        // This will be handled by the main service
      }

      this.logger.error(
        'Failed to create Marzban user:',
        error instanceof Error ? error.message : 'Unknown error',
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build subscription URL using DOMAIN_NAME
   */
  private buildSubscriptionUrl(username: string): string {
    if (this.domainName) {
      return `https://${this.domainName}/${username}`;
    }

    this.logger.warn('DOMAIN_NAME not set, subscription URL may be invalid');
    return `/${username}`;
  }
}
