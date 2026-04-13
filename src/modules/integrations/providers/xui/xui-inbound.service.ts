import { Injectable, Logger } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';
import { XuiInboundsResponse, XuiInbound } from './types/xui.types';

@Injectable()
export class XuiInboundService {
  private readonly logger = new Logger(XuiInboundService.name);

  constructor(private readonly httpClient: AxiosInstance) {}

  /**
   * Get list of all inbounds (available protocols)
   */
  async getInbounds(): Promise<XuiInbound[]> {
    try {
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
   * Get inbound by ID
   */
  async getInboundById(id: number): Promise<XuiInbound | null> {
    const inbounds = await this.getInbounds();
    return inbounds.find((inbound) => inbound.id === id) || null;
  }

  /**
   * Get inbounds by protocol
   */
  async getInboundsByProtocol(protocol: string): Promise<XuiInbound[]> {
    const inbounds = await this.getInbounds();
    return inbounds.filter(
      (inbound) => inbound.protocol.toLowerCase() === protocol.toLowerCase(),
    );
  }

  /**
   * Get enabled inbounds only
   */
  async getEnabledInbounds(): Promise<XuiInbound[]> {
    const inbounds = await this.getInbounds();
    return inbounds.filter((inbound) => inbound.enable);
  }
}
