import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AppConfig } from '../../../../shared/config/configuration';

interface XuiLoginResponse {
  success: boolean;
  msg?: string;
  obj?: {
    token?: string;
  };
}

interface XuiInbound {
  id: number;
  port: number;
  protocol: string;
  settings: string;
  streamSettings: string;
  remark: string;
  enable: boolean;
  up: number;
  down: number;
  total: number;
}

interface XuiInboundsResponse {
  success: boolean;
  msg?: string;
  obj?: XuiInbound[];
}

interface XuiAddClientResponse {
  success: boolean;
  msg?: string;
}

@Injectable()
export class XuiApiService {
  private readonly logger = new Logger(XuiApiService.name);
  private readonly httpClient: AxiosInstance;
  private sessionCookie: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<AppConfig['xuiBaseUrl']>('app.xuiBaseUrl');

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      maxRedirects: 0,
    });

    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.sessionCookie) {
          config.headers['Cookie'] = this.sessionCookie;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }

  private getCredentials(): { username: string; password: string } | null {
    const username = this.configService.get<AppConfig['xuiUsername']>('app.xuiUsername');
    const password = this.configService.get<AppConfig['xuiPassword']>('app.xuiPassword');

    if (!username || !password) {
      this.logger.warn('XUI credentials not configured');
      return null;
    }

    return { username, password };
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

      const response: AxiosResponse<XuiLoginResponse> = await this.httpClient.post(
        '/login',
        formData.toString(),
      );

      if (response.data.success) {
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader && setCookieHeader.length > 0) {
          this.sessionCookie = setCookieHeader[0];
          this.logger.log('Successfully logged in to 3X-UI panel');
          return true;
        }
      }

      this.logger.error('Login failed: Invalid credentials or no session cookie');
      return false;
    } catch (error) {
      this.logger.error('Login failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * Get list of all inbounds (available protocols)
   */
  async getInbounds(): Promise<XuiInbound[]> {
    try {
      if (!this.sessionCookie) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          return [];
        }
      }

      this.logger.log('Fetching inbounds list...');

      const response: AxiosResponse<XuiInboundsResponse> =
        await this.httpClient.get('/xui/inbound/list');

      if (response.data.success && response.data.obj) {
        this.logger.log(`Retrieved ${response.data.obj.length} inbounds`);
        return response.data.obj;
      }

      this.logger.warn('Failed to retrieve inbounds');
      return [];
    } catch (error) {
      this.logger.error(
        'Failed to get inbounds:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return [];
    }
  }

  /**
   * Add a new client (user) to a specific inbound
   */
  async addClient(
    inboundId: number,
    clientData: {
      email: string;
      id?: string;
      password?: string;
      flow?: string;
      limitIp?: number;
      totalGB?: number;
      expireDays?: number;
    },
  ): Promise<boolean> {
    try {
      if (!this.sessionCookie) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          return false;
        }
      }

      this.logger.log(`Adding client ${clientData.email} to inbound ${inboundId}...`);

      const settings = {
        clients: [
          {
            id: clientData.id || this.generateUUID(),
            flow: clientData.flow || 'xtls-rprx-vision',
            email: clientData.email,
            limitIp: clientData.limitIp || 2,
            totalGB: clientData.totalGB || 0,
            expireDays: clientData.expireDays || 30,
            enable: true,
          },
        ],
      };

      const formData = new URLSearchParams();
      formData.append('id', inboundId.toString());
      formData.append('settings', JSON.stringify(settings));

      const response: AxiosResponse<XuiAddClientResponse> = await this.httpClient.post(
        `/xui/inbound/addClient/${inboundId}`,
        formData.toString(),
      );

      if (response.data.success) {
        this.logger.log(`Client ${clientData.email} added successfully`);
        return true;
      }

      this.logger.error(`Failed to add client: ${response.data.msg || 'Unknown error'}`);
      return false;
    } catch (error) {
      this.logger.error(
        'Failed to add client:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }

  /**
   * Generate a UUID for VLESS/VMESS clients
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get connection link for a client
   */
  async getClientLink(inboundId: number, email: string): Promise<string | null> {
    try {
      const inbounds = await this.getInbounds();
      const inbound = inbounds.find((i) => i.id === inboundId);

      if (!inbound) {
        this.logger.warn(`Inbound ${inboundId} not found`);
        return null;
      }

      const settings = JSON.parse(inbound.settings);
      const client = settings.clients?.find((c: { email: string }) => c.email === email);

      if (!client) {
        this.logger.warn(`Client ${email} not found in inbound ${inboundId}`);
        return null;
      }

      const streamSettings = JSON.parse(inbound.streamSettings);
      const baseUrl = this.configService.get<AppConfig['xuiBaseUrl']>('app.xuiBaseUrl');
      const host = baseUrl ? new URL(baseUrl).hostname : 'localhost';

      return this.buildConnectionUrl(inbound.protocol, client, host, inbound.port, streamSettings);
    } catch (error) {
      this.logger.error(
        'Failed to get client link:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  private buildConnectionUrl(
    protocol: string,
    client: { id?: string; email: string },
    host: string,
    port: number,
    streamSettings: { network?: string; security?: string; wsSettings?: { path?: string } },
  ): string {
    switch (protocol.toLowerCase()) {
      case 'vless':
        return `vless://${client.id}@${host}:${port}?encryption=none&security=tls&type=ws&path=/vless#${encodeURIComponent(client.email)}`;
      case 'vmess':
        return `vmess://${Buffer.from(
          JSON.stringify({
            v: '2',
            ps: client.email,
            add: host,
            port: port.toString(),
            id: client.id,
            aid: '0',
            net: streamSettings.network || 'ws',
            type: 'none',
            host: '',
            path: streamSettings.wsSettings?.path || '/',
            tls: streamSettings.security === 'tls' ? 'tls' : '',
          }),
        ).toString('base64')}`;
      default:
        return '';
    }
  }
}
