import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AppConfig } from '../../../../shared/config/configuration';
import { MarzbanAuthService } from './marzban-auth.service';
import { MarzbanCertificateService } from './marzban-certificate.service';
import { MarzbanNodeService } from './marzban-node.service';
import { MarzbanUserService } from './marzban-user.service';
import { CreateUserResult } from './types/marzban.types';

@Injectable()
export class MarzbanService implements OnModuleInit {
  private readonly logger = new Logger(MarzbanService.name);
  private readonly domainName: string | undefined;
  private readonly internalBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authService: MarzbanAuthService,
    private readonly certificateService: MarzbanCertificateService,
    private readonly nodeService: MarzbanNodeService,
    private readonly userService: MarzbanUserService,
  ) {
    // Internal URL for Docker service communication (uses VPN_PANEL_URL)
    this.internalBaseUrl =
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl') ||
      'http://cloudnode-marzban:8000';

    // External domain for public links
    this.domainName =
      this.configService.get<AppConfig['domainName']>('app.domainName');

    // Configure shared HTTP client with authorization interceptor
    const httpClient = this.httpService.axiosRef;
    httpClient.defaults.baseURL = `${this.internalBaseUrl}/api`;
    httpClient.defaults.timeout = 30000;
    httpClient.defaults.headers.common['Content-Type'] = 'application/json';
    httpClient.defaults.headers.common['Accept'] = 'application/json';

    // Add authorization interceptor
    httpClient.interceptors.request.use(
      (config) => {
        const token = this.authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.login();
      await this.fetchAndSaveCert();
      await this.registerInfrastructureNodes();
    } catch (error) {
      this.logger.error(
        'Failed to initialize Marzban service:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Login to Marzban API
   */
  async login(): Promise<boolean> {
    return this.authService.login();
  }

  /**
   * Fetch SSL certificate from Marzban Master and save it locally
   */
  private async fetchAndSaveCert(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.logger.warn('Cannot fetch certificate: not authenticated');
      return;
    }
    await this.certificateService.fetchAndSaveCert();
  }

  /**
   * Register infrastructure nodes from INFRASTRUCTURE_IP_LIST
   */
  private async registerInfrastructureNodes(): Promise<void> {
    await this.nodeService.registerInfrastructureNodes();
  }

  /**
   * Create a new user in Marzban with traffic limit and expiry
   */
  async createUser(
    telegramId: string,
    months: number,
  ): Promise<CreateUserResult> {
    try {
      if (!this.authService.isAuthenticated()) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          return {
            success: false,
            error: 'Not authenticated with Marzban API',
          };
        }
      }

      const result = await this.userService.createUser(telegramId, months);

      // Handle token expiration and retry
      if (!result.success && result.error?.includes('401')) {
        this.logger.log('Token expired, re-authenticating...');
        const loggedIn = await this.login();
        if (loggedIn) {
          return this.userService.createUser(telegramId, months);
        }
      }

      return result;
    } catch (error) {
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
    return this.nodeService.getNodes();
  }

  /**
   * Get formatted nodes message for Telegram
   */
  async getNodesMessage(): Promise<string> {
    return this.nodeService.getNodesMessage();
  }

  /**
   * Get external URL for Marzban panel (for user-facing links)
   */
  getExternalUrl(): string {
    return this.domainName
      ? `https://${this.domainName}`
      : this.internalBaseUrl;
  }

  /**
   * Get internal URL for API calls (Docker service name)
   */
  getInternalUrl(): string {
    return this.internalBaseUrl;
  }
}
