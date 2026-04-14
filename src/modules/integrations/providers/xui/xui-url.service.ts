import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XuiInbound, XuiStreamSettings } from './types/xui.types';
import { AppConfig } from '../../../../shared/config/configuration';

interface RealityParams {
  security: string;
  pbk: string;
  sid: string;
  sni: string;
  fp: string;
}

@Injectable()
export class XuiUrlService {
  private readonly logger = new Logger(XuiUrlService.name);

  constructor(private readonly configService: ConfigService) {}

  private getHost(): string {
    // Priority: DOMAIN_NAME > extract from VPN_PANEL_URL > infrastructureIpList > localhost
    const domainName =
      this.configService.get<AppConfig['domainName']>('app.domainName');
    if (domainName) {
      return domainName;
    }

    const vpnPanelUrl =
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl');
    if (vpnPanelUrl) {
      try {
        return new URL(vpnPanelUrl).hostname;
      } catch {
        // Invalid URL, continue to fallback
      }
    }

    const ipList = this.configService.get<string>('app.infrastructureIpList');
    if (ipList) {
      // Use first IP from comma-separated list
      return ipList.split(',')[0].trim();
    }

    return 'localhost';
  }

  /**
   * Extract Reality parameters from stream settings
   */
  private extractRealityParams(
    streamSettings: XuiStreamSettings,
  ): RealityParams | null {
    if (
      streamSettings.security !== 'reality' ||
      !streamSettings.realitySettings
    ) {
      return null;
    }

    const rs = streamSettings.realitySettings;
    const publicKey = rs.settings?.publicKey;
    const shortId = rs.shortIds?.[0];
    const serverName = rs.settings?.serverName || rs.serverNames?.[0];
    const fingerprint = rs.settings?.fingerprint || 'chrome';

    if (!publicKey || !shortId) {
      this.logger.warn(
        'Incomplete Reality settings: missing publicKey or shortId',
      );
      return null;
    }

    return {
      security: 'reality',
      pbk: publicKey,
      sid: shortId,
      sni: serverName || '',
      fp: fingerprint,
    };
  }

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

      const streamSettings = JSON.parse(
        inbound.streamSettings,
      ) as XuiStreamSettings;
      const host = this.getHost();

      // Extract Reality parameters if applicable
      const realityParams = this.extractRealityParams(streamSettings);

      return this.buildConnectionUrl(
        inbound.protocol,
        client,
        host,
        inbound.port,
        streamSettings,
        realityParams,
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
    realityParams: RealityParams | null,
  ): string {
    switch (protocol.toLowerCase()) {
      case 'vless':
        return this.buildVlessUrl(
          client,
          host,
          port,
          streamSettings,
          realityParams,
        );
      case 'vmess':
        return this.buildVmessUrl(
          client,
          host,
          port,
          streamSettings,
          realityParams,
        );
      case 'trojan':
        return this.buildTrojanUrl(
          client,
          host,
          port,
          streamSettings,
          realityParams,
        );
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
    realityParams: RealityParams | null,
  ): string {
    const params = new URLSearchParams({
      encryption: 'none',
      type: streamSettings.network || 'tcp',
    });

    if (realityParams) {
      params.set('security', realityParams.security);
      params.set('pbk', realityParams.pbk);
      params.set('sid', realityParams.sid);
      if (realityParams.sni) {
        params.set('sni', realityParams.sni);
      }
      params.set('fp', realityParams.fp);
      params.set('flow', 'xtls-rprx-vision');
    } else if (streamSettings.security === 'tls') {
      params.set('security', 'tls');
      if (streamSettings.network === 'ws' && streamSettings.wsSettings?.path) {
        params.set('path', streamSettings.wsSettings.path);
      }
    }

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
    realityParams: RealityParams | null,
  ): string {
    const vmessConfig: Record<string, string> = {
      v: '2',
      ps: client.email,
      add: host,
      port: port.toString(),
      id: client.id,
      aid: '0',
      net: streamSettings.network || 'tcp',
      type: streamSettings.tcpSettings?.header?.type || 'none',
      host: '',
      path:
        streamSettings.wsSettings?.path ||
        streamSettings.grpcSettings?.serviceName ||
        '/',
      tls: realityParams
        ? 'reality'
        : streamSettings.security === 'tls'
          ? 'tls'
          : '',
    };

    // Add Reality-specific fields if applicable
    if (realityParams) {
      vmessConfig.pbk = realityParams.pbk;
      vmessConfig.sid = realityParams.sid;
      if (realityParams.sni) {
        vmessConfig.sni = realityParams.sni;
      }
    }

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
    realityParams: RealityParams | null,
  ): string {
    const params = new URLSearchParams({
      type: streamSettings.network || 'tcp',
    });

    if (realityParams) {
      params.set('security', realityParams.security);
      params.set('pbk', realityParams.pbk);
      params.set('sid', realityParams.sid);
      if (realityParams.sni) {
        params.set('sni', realityParams.sni);
      }
      params.set('fp', realityParams.fp);
    } else {
      params.set(
        'security',
        streamSettings.security === 'tls' ? 'tls' : 'none',
      );
      if (streamSettings.network === 'ws' && streamSettings.wsSettings?.path) {
        params.set('path', streamSettings.wsSettings.path);
      }
    }

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
