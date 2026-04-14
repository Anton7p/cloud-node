import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { XuiAddClientResponse, XuiClientData } from './types/xui.types';
import { XuiApiService } from './xui-api.service';

@Injectable()
export class XuiClientService {
  private readonly logger = new Logger(XuiClientService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly xuiApiService: XuiApiService,
  ) {}

  private getDefaultIpLimit(): number {
    // Default IP limit for XUI clients
    return 2;
  }

  private getDefaultTotalGB(): number {
    // Default totalGB in GB (0 = unlimited)
    return 0;
  }

  private getDefaultExpireDays(): number {
    // Default expiration days for XUI clients
    return 30;
  }

  /**
   * Convert GB to bytes for XUI API
   * XUI expects totalGB in bytes
   */
  private convertGBToBytes(gb: number): number {
    if (gb <= 0) return 0;
    return gb * 1024 * 1024 * 1024;
  }

  /**
   * Convert expire days to Unix timestamp in milliseconds
   * XUI expects exp as timestamp (ms since epoch)
   */
  private convertExpireDaysToTimestamp(expireDays: number): number {
    if (expireDays <= 0) return 0;
    const now = Date.now();
    const daysInMs = expireDays * 24 * 60 * 60 * 1000;
    return now + daysInMs;
  }

  /**
   * Add a new client (user) to a specific inbound
   */
  async addClient(
    inboundId: number,
    clientData: XuiClientData,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Adding client ${clientData.email} to inbound ${inboundId}...`,
      );

      // Convert expireDays to timestamp and totalGB to bytes for XUI API
      const expireTimestamp = this.convertExpireDaysToTimestamp(
        clientData.expireDays ?? this.getDefaultExpireDays(),
      );
      const totalBytes = this.convertGBToBytes(
        clientData.totalGB ?? this.getDefaultTotalGB(),
      );

      const settings = {
        clients: [
          {
            id: clientData.id || randomUUID(),
            flow: clientData.flow || 'xtls-rprx-vision',
            email: clientData.email,
            limitIp: clientData.limitIp ?? this.getDefaultIpLimit(),
            totalGB: totalBytes,
            exp: expireTimestamp,
            enable: true,
          },
        ],
      };

      const formData = new URLSearchParams();
      formData.append('id', inboundId.toString());
      formData.append('settings', JSON.stringify(settings));

      const response = await this.xuiApiService
        .getAxiosInstance()
        .post<XuiAddClientResponse>(
          `/inbound/addClient/${inboundId}`,
          formData.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

      if (response.data.success) {
        this.logger.log(`Client ${clientData.email} added successfully`);
        return true;
      }

      this.logger.error(
        `Failed to add client: ${response.data.msg || 'Unknown error'}`,
      );
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
   * Update existing client in inbound
   */
  async updateClient(
    inboundId: number,
    clientData: XuiClientData,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Updating client ${clientData.email} in inbound ${inboundId}...`,
      );

      // Convert expireDays to timestamp and totalGB to bytes for XUI API
      const expireTimestamp = this.convertExpireDaysToTimestamp(
        clientData.expireDays ?? this.getDefaultExpireDays(),
      );
      const totalBytes = this.convertGBToBytes(
        clientData.totalGB ?? this.getDefaultTotalGB(),
      );

      const settings = {
        clients: [
          {
            id: clientData.id || randomUUID(),
            flow: clientData.flow || 'xtls-rprx-vision',
            email: clientData.email,
            limitIp: clientData.limitIp ?? this.getDefaultIpLimit(),
            totalGB: totalBytes,
            exp: expireTimestamp,
            enable: true,
          },
        ],
      };

      const formData = new URLSearchParams();
      formData.append('id', inboundId.toString());
      formData.append('settings', JSON.stringify(settings));

      const response = await this.xuiApiService
        .getAxiosInstance()
        .post<XuiAddClientResponse>(
          `/inbound/updateClient/${inboundId}`,
          formData.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

      if (response.data.success) {
        this.logger.log(`Client ${clientData.email} updated successfully`);
        return true;
      }

      this.logger.error(
        `Failed to update client: ${response.data.msg || 'Unknown error'}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        'Failed to update client:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }

  /**
   * Delete client from inbound
   */
  async deleteClient(inboundId: number, email: string): Promise<boolean> {
    try {
      this.logger.log(`Deleting client ${email} from inbound ${inboundId}...`);

      const formData = new URLSearchParams();
      formData.append('id', inboundId.toString());
      formData.append('email', email);

      const response = await this.xuiApiService
        .getAxiosInstance()
        .post<XuiAddClientResponse>(
          `/inbound/delClient/${inboundId}`,
          formData.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

      if (response.data.success) {
        this.logger.log(`Client ${email} deleted successfully`);
        return true;
      }

      this.logger.error(
        `Failed to delete client: ${response.data.msg || 'Unknown error'}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        'Failed to delete client:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }
}
