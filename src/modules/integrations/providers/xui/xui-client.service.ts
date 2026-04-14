import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { randomUUID } from 'crypto';
import { XuiAddClientResponse, XuiClientData } from './types/xui.types';
import { AppConfig } from '../../../../shared/config/configuration';

@Injectable()
export class XuiClientService {
  private readonly logger = new Logger(XuiClientService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  private getBaseUrl(): string {
    // Use VPN_PANEL_URL with fallback to internal Docker URL
    return (
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl') ||
      'http://cloudnode-marzban:8000'
    );
  }

  private getApiPath(): string {
    return '/xui';
  }

  private getDefaultIpLimit(): number {
    // Default IP limit for XUI clients
    return 2;
  }

  private getDefaultDataLimit(): number {
    // Default data limit in bytes (0 = unlimited)
    return 0;
  }

  private getDefaultExpireDays(): number {
    // Default expiration days for XUI clients
    return 30;
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

      const settings = {
        clients: [
          {
            id: clientData.id || randomUUID(),
            flow: clientData.flow || 'xtls-rprx-vision',
            email: clientData.email,
            limitIp: clientData.limitIp ?? this.getDefaultIpLimit(),
            totalGB: clientData.totalGB ?? this.getDefaultDataLimit(),
            expireDays: clientData.expireDays ?? this.getDefaultExpireDays(),
            enable: true,
          },
        ],
      };

      const formData = new URLSearchParams();
      formData.append('id', inboundId.toString());
      formData.append('settings', JSON.stringify(settings));

      const baseUrl = this.getBaseUrl();
      const apiPath = this.getApiPath();

      const response =
        await this.httpService.axiosRef.post<XuiAddClientResponse>(
          `${baseUrl}${apiPath}/inbound/addClient/${inboundId}`,
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

      const settings = {
        clients: [
          {
            id: clientData.id || randomUUID(),
            flow: clientData.flow || 'xtls-rprx-vision',
            email: clientData.email,
            limitIp: clientData.limitIp ?? this.getDefaultIpLimit(),
            totalGB: clientData.totalGB ?? this.getDefaultDataLimit(),
            expireDays: clientData.expireDays ?? this.getDefaultExpireDays(),
            enable: true,
          },
        ],
      };

      const formData = new URLSearchParams();
      formData.append('id', inboundId.toString());
      formData.append('settings', JSON.stringify(settings));

      const baseUrl = this.getBaseUrl();
      const apiPath = this.getApiPath();

      const response =
        await this.httpService.axiosRef.post<XuiAddClientResponse>(
          `${baseUrl}${apiPath}/inbound/updateClient/${inboundId}`,
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

      const baseUrl = this.getBaseUrl();
      const apiPath = this.getApiPath();

      const response =
        await this.httpService.axiosRef.post<XuiAddClientResponse>(
          `${baseUrl}${apiPath}/inbound/delClient/${inboundId}`,
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
