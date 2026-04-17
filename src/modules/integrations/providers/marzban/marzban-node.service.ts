import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarzbanNode, NODE_SERVICE_PORT } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';
import { MarzbanApiClient } from './marzban-api-client.service';

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

    let ips: string[] = [];

    // Try parsing as JSON array of objects with 'address' field
    try {
      if (ipList.trim().startsWith('[')) {
        const parsed = JSON.parse(ipList.replace(/'/g, '"')) as Array<{
          address?: string;
          password?: string;
        }>;
        ips = parsed
          .map((item) => item.address)
          .filter((ip): ip is string => !!ip);
      }
    } catch {
      // Not JSON, fall back to comma-separated list
      ips = ipList
        .split(',')
        .map((ip) => ip.trim())
        .filter((ip) => ip);
    }
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
      port: NODE_SERVICE_PORT,
    };

    await this.apiClient.getAxiosInstance().post('/node', nodeData);
  }

  /**
   * Get available nodes from Marzban
   */
  async getNodes(): Promise<string[]> {
    try {
      const existingNodes = await this.getExistingNodes();
      return existingNodes.filter((node) => node.name).map((node) => node.name);
    } catch (error) {
      this.logger.error(
        'Failed to get nodes:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return [];
    }
  }

  /**
   * Get formatted nodes message for Telegram
   */
  async getNodesMessage(): Promise<string> {
    const nodes = await this.getNodes();
    return `Доступ активен. Вам доступны узлы: ${nodes.join(', ')}.`;
  }
}
