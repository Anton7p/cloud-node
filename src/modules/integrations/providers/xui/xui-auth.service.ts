import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosResponse } from 'axios';
import { XuiLoginResponse, XuiCredentials } from './types/xui.types';
import { AppConfig } from '../../../../shared/config/configuration';

@Injectable()
export class XuiAuthService {
  private readonly logger = new Logger(XuiAuthService.name);
  private sessionCookie: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: AxiosInstance,
  ) {}

  /**
   * Login to 3X-UI panel and save session cookie
   */
  async login(): Promise<boolean> {
    try {
      const credentials = this.getCredentials();
      if (!credentials) {
        return false;
      }

      this.logger.log('Logging in to 3X-UI panel...');

      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response: AxiosResponse<XuiLoginResponse> =
        await this.httpClient.post('/login', formData.toString());

      if (response.data.success) {
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader && setCookieHeader.length > 0) {
          this.sessionCookie = setCookieHeader[0];
          this.logger.log('Successfully logged in to 3X-UI panel');
          return true;
        }
      }

      this.logger.error(
        'Login failed: Invalid credentials or no session cookie',
      );
      return false;
    } catch (error) {
      this.logger.error(
        'Login failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }

  private getCredentials(): XuiCredentials | null {
    const username = this.configService.get<AppConfig['marzbanAdminUsername']>(
      'app.marzbanAdminUsername',
    );
    const password = this.configService.get<AppConfig['marzbanAdminPassword']>(
      'app.marzbanAdminPassword',
    );

    if (!username || !password) {
      this.logger.warn('XUI credentials not configured');
      return null;
    }

    return { username, password };
  }

  getSessionCookie(): string | null {
    return this.sessionCookie;
  }

  isAuthenticated(): boolean {
    return this.sessionCookie !== null;
  }

  clearSession(): void {
    this.sessionCookie = null;
  }
}
