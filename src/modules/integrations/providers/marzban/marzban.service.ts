import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../../../../shared/config/configuration';

interface MarzbanTokenResponse {
  access_token: string;
  token_type: string;
}

interface MarzbanUserResponse {
  username: string;
  subscription_url: string;
  expire?: number;
  data_limit?: number;
  status: string;
}

export interface CreateUserResult {
  success: boolean;
  subscriptionUrl?: string;
  username?: string;
  error?: string;
}

@Injectable()
export class MarzbanService implements OnModuleInit {
  private readonly logger = new Logger(MarzbanService.name);
  private readonly httpClient: AxiosInstance;
  private accessToken: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const baseUrl =
      this.configService.get<AppConfig['marzbanBaseUrl']>('app.marzbanBaseUrl');

    this.httpClient = axios.create({
      baseURL: baseUrl ? `${baseUrl}/api` : undefined,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.login();
  }

  private getCredentials(): { username: string; password: string } | null {
    const username =
      this.configService.get<AppConfig['marzbanUsername']>('app.marzbanUsername');
    const password =
      this.configService.get<AppConfig['marzbanPassword']>('app.marzbanPassword');

    if (!username || !password) {
      this.logger.warn('Marzban credentials not configured');
      return null;
    }

    return { username, password };
  }

  /**
   * Login to Marzban API and get JWT token
   */
  async login(): Promise<boolean> {
    try {
      const credentials = this.getCredentials();
      if (!credentials) {
        this.logger.warn('Cannot login: credentials not configured');
        return false;
      }

      this.logger.log('Authenticating with Marzban API...');

      const params = new URLSearchParams();
      params.append('username', credentials.username);
      params.append('password', credentials.password);

      const response = await axios.post<MarzbanTokenResponse>(
        `${this.configService.get<AppConfig['marzbanBaseUrl']>('app.marzbanBaseUrl')}/api/admin/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 30000,
        },
      );

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.logger.log('Successfully authenticated with Marzban API');
        return true;
      }

      this.logger.error('Authentication failed: no access token received');
      return false;
    } catch (error) {
      this.logger.error(
        'Failed to authenticate with Marzban:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }

  /**
   * Create a new user in Marzban with traffic limit and expiry
   */
  async createUser(
    telegramId: string,
    months: number,
  ): Promise<CreateUserResult> {
    try {
      if (!this.accessToken) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          return {
            success: false,
            error: 'Not authenticated with Marzban API',
          };
        }
      }

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

      if (response.data.subscription_url) {
        // Build full subscription URL using SUB_BASE_URL if configured
        const subBaseUrl = this.configService.get<AppConfig['subBaseUrl']>('app.subBaseUrl');
        const subscriptionUrl = subBaseUrl
          ? `${subBaseUrl}/${response.data.subscription_url.split('/').pop()}`
          : response.data.subscription_url;

        this.logger.log(`User ${username} created successfully`);

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
        const loggedIn = await this.login();
        if (loggedIn) {
          return this.createUser(telegramId, months);
        }
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
   * Get available nodes from Marzban
   */
  async getNodes(): Promise<string[]> {
    // For now, return static nodes. In production, this could fetch from Marzban API
    return ['Финляндия', 'Германия', 'Турция'];
  }

  /**
   * Get formatted nodes message for Telegram
   */
  async getNodesMessage(): Promise<string> {
    const nodes = await this.getNodes();
    return `Доступ активен. Вам доступны узлы: ${nodes.join(', ')}.`;
  }
}
