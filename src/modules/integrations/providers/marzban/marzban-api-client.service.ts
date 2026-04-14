import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { AppConfig } from '../../../../shared/config/configuration';
import { MarzbanAuthService } from './marzban-auth.service';

/**
 * MarzbanApiClient - транспортный слой для запросов к API Marzban
 *
 * Ответственности:
 * - Создание и настройка AxiosInstance
 * - JWT интерцептор для автоматической подстановки токена
 * - Единый транспортный слой для всех подсервисов
 */
@Injectable()
export class MarzbanApiClient {
  private readonly logger = new Logger(MarzbanApiClient.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly internalBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: MarzbanAuthService,
  ) {
    this.internalBaseUrl =
      this.configService.get<AppConfig['vpnPanelUrl']>('app.vpnPanelUrl') ||
      'http://cloudnode-marzban:8000';

    // Create isolated axios instance for Marzban API
    this.axiosInstance = axios.create({
      baseURL: `${this.internalBaseUrl}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add authorization interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Add response interceptor for 401 handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.logger.warn(
            'Received 401 from Marzban API, token may be expired',
          );
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Get configured axios instance for making requests to Marzban API
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Get internal base URL for API calls
   */
  getInternalBaseUrl(): string {
    return this.internalBaseUrl;
  }
}
