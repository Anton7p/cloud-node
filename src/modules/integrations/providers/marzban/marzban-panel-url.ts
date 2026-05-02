import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../../shared/config/configuration';

/**
 * Base URL панели (Marzban/XUI): `VPN_PANEL_URL` без завершающего `/`.
 */
export function requireVpnPanelBaseUrl(configService: ConfigService): string {
  const raw = configService
    .get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl')
    ?.trim();
  if (!raw) {
    throw new Error('VPN_PANEL_URL is not defined or empty');
  }
  return raw.replace(/\/+$/, '');
}
