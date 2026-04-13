import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { CreateUserResult, MarzbanUserResponse } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import axios from 'axios';

@Injectable()
export class MarzbanUserService {
  private readonly logger = new Logger(MarzbanUserService.name);
  private readonly domainName: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: AxiosInstance,
  ) {
    this.domainName =
      this.configService.get<AppConfig['domainName']>('app.domainName');
  }

  /**
   * Create a new user in Marzban with traffic limit and expiry
   */
  async createUser(
    telegramId: string,
    months: number,
  ): Promise<CreateUserResult> {
    try {
      const username = `user_${telegramId}`;
      const expireDays = months * 30;
      // 100 GB traffic limit in bytes
      const dataLimit = 107374182400;
      const expireTimestamp = Math.floor(
        (Date.now() + expireDays * 24 * 60 * 60 * 1000) / 1000,
      );

      this.logger.log(
        `Creating Marzban user ${username} with ${months} months subscription`,
      );

      const response = await this.httpClient.post<MarzbanUserResponse>(
        '/user',
        {
          username,
          expire: expireTimestamp,
          data_limit: dataLimit,
          status: 'active',
        },
      );

      if (response.data.subscription_url || response.data.username) {
        // Use subscription_url from Marzban API, or build manually if not provided
        const subscriptionUrl =
          response.data.subscription_url ||
          this.buildSubscriptionUrl(response.data.username);

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
   * Build subscription URL manually if Marzban API doesn't return it
   * Uses DOMAIN_NAME for external links
   */
  private buildSubscriptionUrl(username: string): string {
    const subBaseUrl =
      this.configService.get<AppConfig['subBaseUrl']>('app.subBaseUrl') ||
      (this.domainName ? `https://${this.domainName}` : '');
    return `${subBaseUrl.replace(/\/$/, '')}/${username}`;
  }
}
