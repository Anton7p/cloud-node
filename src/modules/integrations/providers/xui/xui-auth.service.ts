import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { XuiLoginResponse, XuiCredentials } from './types/xui.types';
import { AppConfig } from '../../../../shared/config/configuration';

@Injectable()
export class XuiAuthService {
  private readonly logger = new Logger(XuiAuthService.name);
  private sessionCookie: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.setupRequestInterceptor();
  }

  private setupRequestInterceptor(): void {
    // Add session cookie to all requests via defaults
    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        if (this.sessionCookie) {
          config.headers['Cookie'] = this.sessionCookie;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  private getBaseUrl(): string {
    // Use VPN_PANEL_URL with fallback to internal Docker URL
    return (
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl') ||
      'http://cloudnode-marzban:8000'
    );
  }

  private getApiPath(): string {
    return '/xui';
  }

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

      const baseUrl = this.getBaseUrl();
      const apiPath = this.getApiPath();

      const response = await this.httpService.axiosRef.post<XuiLoginResponse>(
        `${baseUrl}${apiPath}/login`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          maxRedirects: 0,
        },
      );

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
    // Use shared VPN panel credentials (MARZBAN_ADMIN_USERNAME / MARZBAN_ADMIN_PASSWORD)
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

  /**
   * Execute a request with automatic re-login on 302/401
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<{
      data: T;
      status: number;
      headers: Record<string, unknown>;
    }>,
    maxRetries: number = 1,
  ): Promise<{ data: T; status: number; headers: Record<string, unknown> }> {
    try {
      return await requestFn();
    } catch (error) {
      if (
        maxRetries > 0 &&
        (error.response?.status === 302 || error.response?.status === 401)
      ) {
        this.logger.log('Session expired, attempting re-login...');
        this.clearSession();
        const loggedIn = await this.login();
        if (loggedIn) {
          return this.executeWithRetry(requestFn, maxRetries - 1);
        }
      }
      throw error;
    }
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
