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
  private readonly realityPublicKey: string | undefined;
  private readonly realityShortId: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly apiClient: MarzbanApiClient,
  ) {
    this.domainName =
      this.configService.get<AppConfig['domainName']>('app.domainName');
    this.realityPublicKey =
      this.configService.get<AppConfig['realityPublicKey']>('app.realityPublicKey');
    this.realityShortId =
      this.configService.get<AppConfig['realityShortId']>('app.realityShortId') || 'abcd1234';
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
        // Build VLESS Reality connection URL with public key
        const subscriptionUrl = this.buildVlessRealityUrl(
          response.data.username,
          response.data.uuid || this.generateUUID(),
        );

        this.logger.log(
          `User ${response.data.username} created successfully with VLESS Reality URL`,
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
          subscriptionUrl: this.buildVlessRealityUrl(userNameForError, this.generateUUID()),
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
   * Build VLESS Reality connection URL
   * Format: vless://uuid@domain:443?security=reality&flow=xtls-rprx-vision&...
   */
  private buildVlessRealityUrl(username: string, uuid: string): string {
    if (!this.domainName) {
      this.logger.warn('DOMAIN_NAME not set, subscription URL may be invalid');
      return `vless://${uuid}@unknown:443`;
    }

    if (!this.realityPublicKey) {
      this.logger.warn('REALITY_PUBLIC_KEY not set, using subscription path only');
      return `https://${this.domainName}/${username}`;
    }

    // Build VLESS Reality URL with all required parameters
    const params = new URLSearchParams({
      type: 'tcp',
      security: 'reality',
      pbk: this.realityPublicKey,
      sid: this.realityShortId || 'abcd1234',
      fp: 'chrome',
      flow: 'xtls-rprx-vision',
      sni: this.domainName,
    });

    return `vless://${uuid}@${this.domainName}:443?${params.toString()}#${username}`;
  }

  /**
   * Generate UUID v4 for VLESS user
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
