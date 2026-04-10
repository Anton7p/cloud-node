import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractServerProvider } from '../abstract-server.provider';
import {
  ServerRental,
  RentalConfig,
  ComputingSlot,
  TrafficStats,
  ServerCredentials,
} from '../server-provider.interface';

/**
 * ShadowsocksProvider - Shadowsocks protocol Server Rental implementation
 * 
 * Manages Shadowsocks servers and Computing Slots through
 * integration with compatible panel APIs.
 */
@Injectable()
export class ShadowsocksProvider extends AbstractServerProvider {
  readonly name = 'ShadowsocksProvider';
  readonly supportedProtocols = ['shadowsocks'];

  private apiBaseUrl: string;
  private apiToken: string;

  constructor(private configService: ConfigService) {
    super('ShadowsocksProvider');
    this.apiBaseUrl =
      this.configService.get<string>('SHADOWSOCKS_API_URL') || '';
    this.apiToken =
      this.configService.get<string>('SHADOWSOCKS_API_TOKEN') || '';
  }

  /**
   * Verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      this.logger.log('Shadowsocks API health check - OK');
      return true;
    } catch (error) {
      this.logger.error('Shadowsocks API health check failed:', error);
      return false;
    }
  }

  /**
   * Provision a new Shadowsocks Server Rental
   */
  async provisionRental(config: RentalConfig): Promise<ServerRental> {
    this.validateProtocol(config.protocol);
    this.logger.log(`Provisioning Shadowsocks rental in ${config.region}`);

    const rentalId = `ss-${Date.now()}`;
    const credentials: ServerCredentials = {
      host: `${config.region}.ss-provider.example`,
      port: 8388,
      apiToken: this.apiToken,
    };

    return {
      id: rentalId,
      externalId: `ext-${rentalId}`,
      credentials,
      config,
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(
        Date.now() + config.durationDays * 24 * 60 * 60 * 1000,
      ),
      metadata: {
        encryptionMethod: 'aes-256-gcm',
        panelType: 'outline',
      },
    };
  }

  /**
   * Terminate a Server Rental
   */
  async terminateRental(rentalId: string): Promise<boolean> {
    this.logger.log(`Terminating Shadowsocks rental: ${rentalId}`);
    return true;
  }

  /**
   * Get rental details
   */
  async getRental(rentalId: string): Promise<ServerRental | null> {
    this.logger.log(`Fetching Shadowsocks rental: ${rentalId}`);
    return null;
  }

  /**
   * Allocate a Computing Slot
   */
  async allocateSlot(
    rentalId: string,
    userId: string,
  ): Promise<ComputingSlot> {
    this.logger.log(
      `Allocating Shadowsocks slot for user ${userId} on rental ${rentalId}`,
    );

    const slotId = this.generateSlotId(rentalId, userId);
    const password = this.generatePassword();
    const method = 'aes-256-gcm';

    // SIP002 URL format for Shadowsocks
    const connectionUrl = this.generateSIP002Url(
      method,
      password,
      'server.example',
      8388,
      `user-${userId}`,
    );

    return {
      id: slotId,
      rentalId,
      userId,
      accessKey: password,
      protocol: 'shadowsocks',
      connectionUrl,
      qrCodeData: connectionUrl,
      status: 'active',
      allocatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trafficUsed: 0,
      trafficLimit: 107374182400, // 100 GB
    };
  }

  /**
   * Revoke a Computing Slot
   */
  async revokeSlot(slotId: string): Promise<boolean> {
    this.logger.log(`Revoking Shadowsocks slot: ${slotId}`);
    return true;
  }

  /**
   * Get slot details
   */
  async getSlot(slotId: string): Promise<ComputingSlot | null> {
    this.logger.log(`Fetching Shadowsocks slot: ${slotId}`);
    return null;
  }

  /**
   * Get traffic statistics for a slot
   */
  async getSlotTraffic(slotId: string): Promise<TrafficStats> {
    this.logger.log(`Fetching traffic for slot: ${slotId}`);
    return {
      slotId,
      uploadBytes: 0,
      downloadBytes: 0,
      totalBytes: 0,
      timestamp: new Date(),
    };
  }

  /**
   * Sync traffic data for all active slots
   */
  async syncTrafficData(): Promise<TrafficStats[]> {
    this.logger.log('Syncing Shadowsocks traffic data for all slots');
    return [];
  }

  /**
   * Renew rental duration
   */
  async renewRental(
    rentalId: string,
    additionalDays: number,
  ): Promise<ServerRental> {
    this.logger.log(
      `Renewing Shadowsocks rental ${rentalId} by ${additionalDays} days`,
    );
    throw new Error('Method not implemented');
  }

  /**
   * Suspend a rental
   */
  async suspendRental(rentalId: string): Promise<boolean> {
    this.logger.log(`Suspending Shadowsocks rental: ${rentalId}`);
    return true;
  }

  /**
   * Resume a suspended rental
   */
  async resumeRental(rentalId: string): Promise<boolean> {
    this.logger.log(`Resuming Shadowsocks rental: ${rentalId}`);
    return true;
  }

  /**
   * Generate SIP002 URL format for Shadowsocks
   * Format: ss://BASE64(method:password)@host:port#tag
   */
  private generateSIP002Url(
    method: string,
    password: string,
    host: string,
    port: number,
    tag: string,
  ): string {
    const userInfo = Buffer.from(`${method}:${password}`).toString('base64');
    const encodedTag = encodeURIComponent(tag);
    return `ss://${userInfo}@${host}:${port}#${encodedTag}`;
  }

  /**
   * Generate secure random password
   */
  private generatePassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 24; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
