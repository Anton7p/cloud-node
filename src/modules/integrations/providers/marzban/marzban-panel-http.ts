import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { requireVpnPanelBaseUrl } from './marzban-panel-url';

export const PANEL_HTTP_TIMEOUT_MS = 30_000;

/**
 * HTTP-клиент к префиксу `/api` панели без Bearer (токен админа, первый admin).
 * Совпадает по baseURL и таймауту с {@link MarzbanApiClient}.
 */
export function createPanelApiBareClient(
  configService: ConfigService,
): AxiosInstance {
  const root = requireVpnPanelBaseUrl(configService);
  return axios.create({
    baseURL: `${root}/api`,
    timeout: PANEL_HTTP_TIMEOUT_MS,
    headers: {
      Accept: 'application/json',
    },
    maxRedirects: 5,
  });
}
