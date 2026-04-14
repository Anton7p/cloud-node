import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XuiInboundsResponse, XuiInbound } from './types/xui.types';
import { XuiApiService } from './xui-api.service';

interface CachedInbounds {
  data: XuiInbound[];
  timestamp: number;
}

@Injectable()
export class XuiInboundService {
  private readonly logger = new Logger(XuiInboundService.name);
  private cache: CachedInbounds | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly xuiApiService: XuiApiService,
  ) {}

  private getCacheTtl(): number {
    // Convert seconds to milliseconds (default: 60 seconds)
    return 60 * 1000;
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const ttl = this.getCacheTtl();
    return Date.now() - this.cache.timestamp < ttl;
  }

  /**
   * Get list of all inbounds (available protocols)
   * Uses caching to avoid spamming the API
   */
  async getInbounds(): Promise<XuiInbound[]> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      this.logger.debug(`Returning ${this.cache.data.length} cached inbounds`);
      return this.cache.data;
    }

    try {
      this.logger.log('Fetching inbounds list from XUI...');

      const response = await this.xuiApiService
        .getAxiosInstance()
        .get<XuiInboundsResponse>('/inbound/list');

      if (response.data.success && response.data.obj) {
        this.logger.log(`Retrieved ${response.data.obj.length} inbounds`);
        // Update cache
        this.cache = {
          data: response.data.obj,
          timestamp: Date.now(),
        };
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
   * Clear the inbounds cache
   */
  clearCache(): void {
    this.cache = null;
    this.logger.log('Inbounds cache cleared');
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
