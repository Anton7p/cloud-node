import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { MarzbanNode, NODE_SERVICE_PORT } from './types/marzban.types';
import { AppConfig } from '../../../../shared/config/configuration';

@Injectable()
export class MarzbanNodeService {
  private readonly logger = new Logger(MarzbanNodeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: AxiosInstance,
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
  async getExistingNodes(): Promise<MarzbanNode[]> {
    try {
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
    const nodeData: MarzbanNode = {
      name: `Node-${ip}`,
      address: ip,
      port: NODE_SERVICE_PORT,
    };

    await this.httpClient.post('/node', nodeData);
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
}
