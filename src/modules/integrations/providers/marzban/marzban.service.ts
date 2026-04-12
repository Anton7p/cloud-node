import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
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

interface MarzbanNode {
  id?: number;
  name: string;
  address: string;
  port: number;
  status?: string;
}

interface MarzbanNodeSettings {
  certificate: string;
}

const NODE_SERVICE_PORT = 62050;
const DEFAULT_CERT_DIR = '/var/www/marzban_node/var';
const CERT_FILENAME = 'ssl_client_cert.pem';

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
  private readonly certPath: string;
  private accessToken: string | null = null;

  constructor(private readonly configService: ConfigService) {
    const baseUrl =
      this.configService.get<AppConfig['marzbanUrl']>('app.marzbanUrl');

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

    const certDir =
      this.configService.get<AppConfig['marzbanNodeCertDir']>(
        'app.marzbanNodeCertDir',
      ) || DEFAULT_CERT_DIR;
    this.certPath = path.join(certDir, CERT_FILENAME);
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
   * Fetch SSL certificate from Marzban Master and save it locally
   */
  private async fetchAndSaveCert(): Promise<void> {
    try {
      if (!this.accessToken) {
        this.logger.warn('Cannot fetch certificate: not authenticated');
        return;
      }

      this.logger.log('Fetching SSL certificate from Marzban Master...');

      const response =
        await this.httpClient.get<MarzbanNodeSettings>('/nodes/settings');

      if (!response.data?.certificate) {
        this.logger.warn('No certificate returned from Marzban API');
        return;
      }

      const certDir = path.dirname(this.certPath);

      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
        this.logger.log(`Created certificate directory: ${certDir}`);
      }

      fs.writeFileSync(this.certPath, response.data.certificate, {
        mode: 0o644,
      });

      this.logger.log(`SSL certificate saved to: ${this.certPath}`);
    } catch (error) {
      this.logger.error(
        'Failed to fetch and save certificate:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Register infrastructure nodes from INFRASTRUCTURE_IP_LIST
   */
  private async registerInfrastructureNodes(): Promise<void> {
    const ipList = this.configService.get<AppConfig['infrastructureIpList']>(
      'app.infrastructureIpList',
    );
    if (!ipList) {
      this.logger.log(
        'INFRASTRUCTURE_IP_LIST not configured, skipping node registration',
      );
      return;
    }

    const ips = ipList
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip);
    if (ips.length === 0) {
      this.logger.log('No infrastructure IPs found');
      return;
    }

    this.logger.log(`Found ${ips.length} infrastructure node(s) to register`);

    // Get existing nodes to check for duplicates
    const existingNodes = await this.getExistingNodes();
    const existingAddresses = new Set(existingNodes.map((n) => n.address));

    for (const ip of ips) {
      if (existingAddresses.has(ip)) {
        this.logger.log(`Node ${ip} already exists, skipping`);
        continue;
      }

      try {
        await this.createNode(ip);
        this.logger.log(`Successfully registered node: ${ip}`);
      } catch (error) {
        this.logger.error(
          `Failed to register node ${ip}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  /**
   * Get existing nodes from Marzban
   */
  private async getExistingNodes(): Promise<MarzbanNode[]> {
    try {
      if (!this.accessToken) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          this.logger.warn('Cannot get nodes: not authenticated');
          return [];
        }
      }

      const response = await this.httpClient.get<MarzbanNode[]>('/nodes');
      return response.data || [];
    } catch (error) {
      this.logger.error(
        'Failed to get existing nodes:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return [];
    }
  }

  /**
   * Create a new node in Marzban
   */
  private async createNode(ip: string): Promise<void> {
    if (!this.accessToken) {
      const loggedIn = await this.login();
      if (!loggedIn) {
        throw new Error('Not authenticated with Marzban API');
      }
    }

    const nodeData: MarzbanNode = {
      name: `Node-${ip}`,
      address: ip,
      port: NODE_SERVICE_PORT,
    };

    await this.httpClient.post('/node', nodeData);
  }

  private getCredentials(): { username: string; password: string } | null {
    const username = this.configService.get<AppConfig['marzbanAdminUsername']>(
      'app.marzbanAdminUsername',
    );
    const password = this.configService.get<AppConfig['marzbanAdminPassword']>(
      'app.marzbanAdminPassword',
    );

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
        `${this.configService.get<AppConfig['marzbanUrl']>('app.marzbanUrl')}/api/admin/token`,
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

      if (response.data.subscription_url || response.data.username) {
        // Use subscription_url from Marzban API, or build manually if not provided
        const subscriptionUrl =
          response.data.subscription_url ||
          this.buildSubscriptionUrl(response.data.username);

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

  /**
   * Build subscription URL manually if Marzban API doesn't return it
   */
  private buildSubscriptionUrl(username: string): string {
    const subBaseUrl =
      this.configService.get<AppConfig['subBaseUrl']>('app.subBaseUrl') ||
      'https://cloudnode-host.ru';
    return `${subBaseUrl.replace(/\/$/, '')}/${username}`;
  }
}
