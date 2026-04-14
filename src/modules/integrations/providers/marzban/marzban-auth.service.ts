import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
import {
  MarzbanTokenResponse,
  MarzbanCredentials,
} from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';

@Injectable()
export class MarzbanAuthService {
  private readonly logger = new Logger(MarzbanAuthService.name);
  private accessToken: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private getInternalBaseUrl(): string {
    return (
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl') ||
      'http://cloudnode-marzban:8000'
    );
  }

  /**
   * Login to Marzban API and get JWT token with retry logic
   */
  async login(): Promise<boolean> {
    const maxRetries = 10;
    const retryDelayMs = 5000;
    let adminCreated = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const credentials = this.getCredentials();
        if (!credentials) {
          this.logger.warn('Cannot login: credentials not configured');
          return false;
        }

        if (attempt > 1) {
          this.logger.log(`Retry attempt ${attempt}/${maxRetries}...`);
        } else {
          this.logger.log('Authenticating with Marzban API...');
        }

        const params = new URLSearchParams();
        params.append('username', credentials.username);
        params.append('password', credentials.password);

        const baseUrl = this.getInternalBaseUrl();
        const response =
          await this.httpService.axiosRef.post<MarzbanTokenResponse>(
            `${baseUrl}/api/admin/token`,
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
        const isLastAttempt = attempt === maxRetries;
        const isAxiosError = axios.isAxiosError(error);
        const isConnectionError =
          isAxiosError &&
          (error.code === 'ECONNREFUSED' ||
            error.code === 'ECONNRESET' ||
            error.code === 'ENOTFOUND');

        // If 401 and admin not yet created, try to create first admin
        const isUnauthorized = isAxiosError && error.response?.status === 401;
        if (isUnauthorized && !adminCreated && attempt > 2) {
          this.logger.log(
            'Authentication failed with 401, attempting to create first admin...',
          );
          adminCreated = await this.createFirstAdmin();
          if (adminCreated) {
            // Retry immediately after creating admin
            continue;
          }
        }

        if (isConnectionError && !isLastAttempt) {
          this.logger.warn(
            `Connection refused, waiting ${retryDelayMs / 1000}s before retry...`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }

        this.logger.error(
          'Failed to authenticate with Marzban:',
          error instanceof Error ? error.message : 'Unknown error',
        );
        return false;
      }
    }

    return false;
  }

  /**
   * Create first admin user in Marzban (only works when no admins exist)
   */
  private async createFirstAdmin(): Promise<boolean> {
    try {
      const credentials = this.getCredentials();
      if (!credentials) {
        this.logger.warn('Cannot create admin: credentials not configured');
        return false;
      }

      this.logger.log('Creating first admin user in Marzban...');

      const baseUrl = this.getInternalBaseUrl();
      const response = await this.httpService.axiosRef.post(
        `${baseUrl}/api/admin`,
        {
          username: credentials.username,
          password: credentials.password,
          is_sudo: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      if (response.status === 201 || response.status === 200) {
        this.logger.log('First admin user created successfully');
        return true;
      }

      return false;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        this.logger.warn(
          'Admin creation forbidden - admin may already exist or API requires auth',
        );
      } else {
        this.logger.error(
          'Failed to create first admin:',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
      return false;
    }
  }

  private getCredentials(): MarzbanCredentials | null {
    const username = this.configService.get<AppConfig['vpnAdminUsername']>(
      'app.vpnAdminUsername',
    );
    const password = this.configService.get<AppConfig['vpnAdminPassword']>(
      'app.vpnAdminPassword',
    );

    if (!username || !password) {
      this.logger.warn('VPN panel credentials not configured');
      return null;
    }

    return { username, password };
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}
