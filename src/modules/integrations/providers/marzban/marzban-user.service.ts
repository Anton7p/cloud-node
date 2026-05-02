import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  CreateUserResult,
  MarzbanUserResponse,
  SuspendUserResult,
} from './types/marzban.types';
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
    const username = `user_${telegramId}`;
    const daysPerMonth = this.configService.get<
      AppConfig['subscriptionDaysPerMonth']
    >('app.subscriptionDaysPerMonth');
    const dataLimit = this.configService.get<AppConfig['defaultDataLimit']>(
      'app.defaultDataLimit',
    );

    // Trial account detection: months <= 0.1 (approximately 3 days or less)
    const isTrialAccount = months <= 0.1;
    const trialDays =
      this.configService.get<AppConfig['trialDays']>('app.trialDays') || 3;
    const trialIpLimit =
      this.configService.get<AppConfig['trialIpLimit']>('app.trialIpLimit') ||
      2;

    // Calculate expire: use trialDays for trial accounts, otherwise months * daysPerMonth
    const expireDays = isTrialAccount ? trialDays : months * daysPerMonth;
    const expireTimestamp = Math.floor(
      (Date.now() + expireDays * 24 * 60 * 60 * 1000) / 1000,
    );

    // Get inbound tag from config for VLESS Reality
    const inboundTag =
      this.configService.get<AppConfig['marzbanInboundTag']>(
        'app.marzbanInboundTag',
      ) || 'VLESS TCP REALITY';

    let requestBody: Record<string, unknown>;

    try {
      this.logger.log(
        `Creating Marzban user ${username} with ${isTrialAccount ? trialDays + ' days trial' : months + ' months subscription'}` +
          (isTrialAccount ? ` (limitIp: ${trialIpLimit})` : ''),
      );

      requestBody = {
        username,
        expire: expireTimestamp,
        data_limit: dataLimit,
        status: 'active',
        proxies: {
          vless: {},
        },
        inbounds: {
          vless: [inboundTag],
        },
      };

      // Add limitIp for trial accounts
      if (isTrialAccount) {
        requestBody.limitIp = trialIpLimit;
      }

      const response = await this.apiClient
        .getAxiosInstance()
        .post<MarzbanUserResponse>('/user', requestBody);

      if (response.data.subscription_url || response.data.username) {
        // Use subscription URL from Marzban API
        const subscriptionUrl = this.getSubscriptionUrl(
          response.data.subscription_url,
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
          subscriptionUrl: this.getSubscriptionUrl(null, userNameForError),
          username: userNameForError,
        };
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return {
          success: false,
          unauthorized: true,
          error: 'Unauthorized',
        };
      }

      // Log detailed error for 422 validation errors
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errorDetails = error.response?.data;
        this.logger.error(
          `Marzban API validation error (422): ${JSON.stringify(errorDetails)}`,
        );
        this.logger.error(`Request body was: ${JSON.stringify(requestBody)}`);
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
   * Build full subscription URL from Marzban API response
   * If subscription_url is relative, prepend domain name
   */
  private getSubscriptionUrl(
    subscriptionPath: string | null | undefined,
    username: string,
  ): string {
    if (!this.domainName) {
      this.logger.warn('DOMAIN_NAME not set, subscription URL may be invalid');
      return subscriptionPath || `/${username}`;
    }

    // If subscription_path is provided by API, use it
    if (subscriptionPath) {
      // Check if it's already a full URL
      if (
        subscriptionPath.startsWith('http://') ||
        subscriptionPath.startsWith('https://')
      ) {
        return subscriptionPath;
      }
      // Prepend domain to relative path
      return `https://${this.domainName}${subscriptionPath}`;
    }

    // Fallback to default subscription path
    return `https://${this.domainName}/sub/${username}`;
  }

  /**
   * Disable VPN user (e.g. subscription expired).
   */
  async suspendUser(telegramId: string): Promise<SuspendUserResult> {
    const username = `user_${telegramId}`;
    try {
      await this.apiClient.getAxiosInstance().put(`/user/${username}`, {
        status: 'disabled',
      });
      this.logger.log(`Suspended Marzban user ${username}`);
      return { ok: true };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.warn(`Marzban user ${username} not found during suspend`);
        return { ok: false, unauthorized: false };
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.logger.warn('suspendUser: unauthorized (caller should re-login)');
        return { ok: false, unauthorized: true };
      }
      this.logger.error(
        `Failed to suspend Marzban user ${username}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return { ok: false, unauthorized: false };
    }
  }
}
