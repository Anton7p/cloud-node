import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../../../../shared/config/configuration';
import { XuiAuthService } from './xui-auth.service';
import { XuiInboundService } from './xui-inbound.service';
import { XuiClientService } from './xui-client.service';
import { XuiUrlService } from './xui-url.service';
import { XuiInbound, XuiClientData } from './types/xui.types';

@Injectable()
export class XuiApiService {
  private readonly logger = new Logger(XuiApiService.name);
  private readonly axiosInstance: AxiosInstance;

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

    // Create isolated axios instance for XUI API
    this.axiosInstance = axios.create({
      baseURL: `${baseUrl}${apiPath}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxRedirects: 0,
    });

    // Add session cookie interceptor
    this.axiosInstance.interceptors.request.use(
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
   * Get isolated axios instance for XUI API
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
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
