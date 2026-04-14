import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AppConfig } from '../../../../shared/config/configuration';
import { XuiAuthService } from './xui-auth.service';
import { XuiInboundService } from './xui-inbound.service';
import { XuiClientService } from './xui-client.service';
import { XuiUrlService } from './xui-url.service';
import { XuiInbound, XuiClientData } from './types/xui.types';

@Injectable()
export class XuiApiService {
  private readonly logger = new Logger(XuiApiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authService: XuiAuthService,
    private readonly inboundService: XuiInboundService,
    private readonly clientService: XuiClientService,
    private readonly urlService: XuiUrlService,
  ) {
    // Use VPN_PANEL_URL with fallback to internal Docker URL
    const baseUrl =
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl') ||
      'http://cloudnode-marzban:8000';
    const apiPath = '/xui';

    // Configure shared HTTP client
    const httpClient = this.httpService.axiosRef;
    httpClient.defaults.baseURL = `${baseUrl}${apiPath}`;
    httpClient.defaults.timeout = 30000;
    httpClient.defaults.headers.common['Content-Type'] =
      'application/x-www-form-urlencoded';
    httpClient.defaults.maxRedirects = 0;

    // Add session cookie interceptor
    httpClient.interceptors.request.use(
      (config) => {
        const sessionCookie = this.authService.getSessionCookie();
        if (sessionCookie) {
          config.headers['Cookie'] = sessionCookie;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  /**
   * Login to 3X-UI panel and save session cookie
   */
  async login(): Promise<boolean> {
    return this.authService.login();
  }

  /**
   * Get list of all inbounds (available protocols)
   */
  async getInbounds(): Promise<XuiInbound[]> {
    if (!this.authService.isAuthenticated()) {
      const loggedIn = await this.login();
      if (!loggedIn) {
        return [];
      }
    }
    return this.inboundService.getInbounds();
  }

  /**
   * Add a new client (user) to a specific inbound
   */
  async addClient(
    inboundId: number,
    clientData: XuiClientData,
  ): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      const loggedIn = await this.login();
      if (!loggedIn) {
        return false;
      }
    }
    return this.clientService.addClient(inboundId, clientData);
  }

  /**
   * Get connection link for a client
   */
  async getClientLink(
    inboundId: number,
    email: string,
  ): Promise<string | null> {
    const inbounds = await this.getInbounds();
    return this.urlService.getClientLink(inboundId, email, inbounds);
  }
}
