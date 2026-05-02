import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarzbanNode } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import { MarzbanApiClient } from './marzban-api-client.service';

/**
 * Одна строка из `INFRASTRUCTURE_IP_LIST` (GitHub secret / .env).
 * `password` не уходит в Marzban REST — нужен для Ansible/CI при настройке ноды по SSH.
 */
interface InfrastructureEntry {
  address: string;
  password?: string;
}

@Injectable()
export class MarzbanNodeService {
  private readonly logger = new Logger(MarzbanNodeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly apiClient: MarzbanApiClient,
  ) {}

  /**
   * Register infrastructure nodes from INFRASTRUCTURE_IP_LIST
   */
  async registerInfrastructureNodes(): Promise<void> {
    const ipList = this.configService.get<AppConfig['infrastructureIpList']>(
      'app.infrastructureIpList',
    );
    if (!ipList) {
      this.logger.log(
        'INFRASTRUCTURE_IP_LIST not configured, skipping node registration',
      );
      return;
    }

    const entries = this.parseInfrastructureEntries(ipList);
    if (entries.length === 0) {
      this.logger.log('No infrastructure IPs found');
      return;
    }

    this.logger.log(
      `Found ${entries.length} infrastructure node(s) to register`,
    );

    // Get existing nodes to check for duplicates
    const existingNodes = await this.getExistingNodes();
    const existingAddresses = new Set(existingNodes.map((n) => n.address));

    for (const { address: ip } of entries) {
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
   * GitHub secrets и Ansible отдают валидный JSON:
   * `[{"address":"1.2.3.4","password":"..."}]`.
   * Локально допускается fallback: CSV `1.2.3.4, 5.6.7.8` (без паролей).
   */
  private parseInfrastructureEntries(raw: string): InfrastructureEntry[] {
    const trimmed = this.unwrapOuterQuotes(raw.trim());
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
          this.logger.warn(
            'INFRASTRUCTURE_IP_LIST: expected JSON array, skipping node registration',
          );
          return [];
        }
        const out: InfrastructureEntry[] = [];
        for (const item of parsed) {
          if (
            item &&
            typeof item === 'object' &&
            'address' in item &&
            typeof (item as InfrastructureEntry).address === 'string'
          ) {
            const address = (item as InfrastructureEntry).address.trim();
            const password =
              'password' in item &&
              typeof (item as InfrastructureEntry).password === 'string'
                ? (item as InfrastructureEntry).password
                : undefined;
            if (address) {
              out.push(
                password !== undefined ? { address, password } : { address },
              );
            }
          }
        }
        return out;
      } catch {
        this.logger.warn(
          'INFRASTRUCTURE_IP_LIST: invalid JSON starting with "["; fix secret or env value',
        );
        return [];
      }
    }

    return trimmed
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)
      .map((address) => ({ address }));
  }

  /** Снимает внешние одинарные/двойные кавычки, если вся строка в них обёрнута (частый .env-стиль). */
  private unwrapOuterQuotes(value: string): string {
    if (value.length < 2) {
      return value;
    }
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      return value.slice(1, -1).trim();
    }
    return value;
  }

  /**
   * Get existing nodes from Marzban
   */
  async getExistingNodes(): Promise<MarzbanNode[]> {
    try {
      const response = await this.apiClient
        .getAxiosInstance()
        .get<MarzbanNode[]>('/nodes');
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
    const nodeData: MarzbanNode = {
      name: `Node-${ip}`,
      address: ip,
      port: 62050,
    };

    await this.apiClient.getAxiosInstance().post('/node', nodeData);
  }
}
