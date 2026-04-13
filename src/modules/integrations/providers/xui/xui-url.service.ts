import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XuiInbound, XuiStreamSettings } from './types/xui.types';
import { AppConfig } from '../../../../shared/config/configuration';

@Injectable()
export class XuiUrlService {
  private readonly logger = new Logger(XuiUrlService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get connection link for a client
   */
  async getClientLink(
    inboundId: number,
    email: string,
    inbounds: XuiInbound[],
  ): Promise<string | null> {
    try {
      const inbound = inbounds.find((i) => i.id === inboundId);

      if (!inbound) {
        this.logger.warn(`Inbound ${inboundId} not found`);
        return null;
      }

      const settings = JSON.parse(inbound.settings);
      const client = settings.clients?.find(
        (c: { email: string }) => c.email === email,
      );

      if (!client) {
        this.logger.warn(`Client ${email} not found in inbound ${inboundId}`);
        return null;
      }

      const streamSettings = JSON.parse(inbound.streamSettings) as XuiStreamSettings;
      const baseUrl =
        this.configService.get<AppConfig['marzbanUrl']>('app.marzbanUrl');
      const host = baseUrl ? new URL(baseUrl).hostname : 'localhost';

      return this.buildConnectionUrl(
        inbound.protocol,
        client,
        host,
        inbound.port,
        streamSettings,
      );
    } catch (error) {
      this.logger.error(
        'Failed to get client link:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Build connection URL for different protocols
   */
  private buildConnectionUrl(
    protocol: string,
    client: { id?: string; email: string },
    host: string,
    port: number,
    streamSettings: XuiStreamSettings,
  ): string {
    switch (protocol.toLowerCase()) {
      case 'vless':
        return this.buildVlessUrl(client, host, port, streamSettings);
      case 'vmess':
        return this.buildVmessUrl(client, host, port, streamSettings);
      case 'trojan':
        return this.buildTrojanUrl(client, host, port, streamSettings);
      case 'shadowsocks':
        return this.buildShadowsocksUrl(client, host, port);
      default:
        this.logger.warn(`Unsupported protocol: ${protocol}`);
        return '';
    }
  }

  /**
   * Build VLESS connection URL
   */
  private buildVlessUrl(
    client: { id?: string; email: string },
    host: string,
    port: number,
    streamSettings: XuiStreamSettings,
  ): string {
    const params = new URLSearchParams({
      encryption: 'none',
      security: streamSettings.security || 'tls',
      type: streamSettings.network || 'ws',
      path: streamSettings.wsSettings?.path || '/vless',
    });

    return `vless://${client.id}@${host}:${port}?${params.toString()}#${encodeURIComponent(client.email)}`;
  }

  /**
   * Build VMESS connection URL
   */
  private buildVmessUrl(
    client: { id?: string; email: string },
    host: string,
    port: number,
    streamSettings: XuiStreamSettings,
  ): string {
    const vmessConfig = {
      v: '2',
      ps: client.email,
      add: host,
      port: port.toString(),
      id: client.id,
      aid: '0',
      net: streamSettings.network || 'ws',
      type: 'none',
      host: '',
      path: streamSettings.wsSettings?.path || '/',
      tls: streamSettings.security === 'tls' ? 'tls' : '',
    };

    return `vmess://${Buffer.from(JSON.stringify(vmessConfig)).toString('base64')}`;
  }

  /**
   * Build Trojan connection URL
   */
  private buildTrojanUrl(
    client: { id?: string; email: string },
    host: string,
    port: number,
    streamSettings: XuiStreamSettings,
  ): string {
    const params = new URLSearchParams({
      security: streamSettings.security || 'tls',
      type: streamSettings.network || 'ws',
      path: streamSettings.wsSettings?.path || '/trojan',
    });

    return `trojan://${client.id}@${host}:${port}?${params.toString()}#${encodeURIComponent(client.email)}`;
  }

  /**
   * Build Shadowsocks connection URL
   */
  private buildShadowsocksUrl(
    client: { id?: string; email: string },
    host: string,
    port: number,
  ): string {
    // For Shadowsocks, client.id contains the encryption method and password
    const [method, password] = (client.id || '').split(':');
    if (!method || !password) {
      this.logger.warn('Invalid Shadowsocks client configuration');
      return '';
    }

    const userInfo = `${method}:${password}`;
    const encodedUserInfo = Buffer.from(userInfo).toString('base64');
    
    return `ss://${encodedUserInfo}@${host}:${port}#${encodeURIComponent(client.email)}`;
  }
}
