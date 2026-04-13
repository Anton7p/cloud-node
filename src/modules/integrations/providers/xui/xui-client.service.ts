import { Injectable, Logger } from '@nestjs/common';
import { AxiosInstance, AxiosResponse } from 'axios';
import { XuiAddClientResponse, XuiClientData } from './types/xui.types';

@Injectable()
export class XuiClientService {
  private readonly logger = new Logger(XuiClientService.name);

  constructor(private readonly httpClient: AxiosInstance) {}

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

      const response: AxiosResponse<XuiAddClientResponse> =
        await this.httpClient.post(
          `/xui/inbound/addClient/${inboundId}`,
          formData.toString(),
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

      const response: AxiosResponse<XuiAddClientResponse> =
        await this.httpClient.post(
          `/xui/inbound/updateClient/${inboundId}`,
          formData.toString(),
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

      const response: AxiosResponse<XuiAddClientResponse> =
        await this.httpClient.post(
          `/xui/inbound/delClient/${inboundId}`,
          formData.toString(),
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
