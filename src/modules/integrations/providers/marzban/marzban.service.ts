import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MarzbanAuthService } from './marzban-auth.service';
import { MarzbanCertificateService } from './marzban-certificate.service';
import { MarzbanNodeService } from './marzban-node.service';
import { MarzbanUserService } from './marzban-user.service';
import { CreateUserResult } from './types/marzban.types';

/**
 * MarzbanService - высокоуровневый фасад для работы с Marzban API
 *
 * Ответственности:
 * - Оркестрация подсервисов (Auth, Certificate, Node, User)
 * - Инициализация модуля (login -> fetch cert -> register nodes)
 * - Предоставление внешнего API для других модулей
 *
 * Зависимости:
 * - MarzbanAuthService: аутентификация и токены
 * - MarzbanCertificateService: работа с SSL сертификатами
 * - MarzbanNodeService: управление нодами
 * - MarzbanUserService: управление пользователями
 *
 * НЕ имеет прямых HTTP клиентов - весь транспорт через подсервисы.
 */
@Injectable()
export class MarzbanService implements OnModuleInit {
  private readonly logger = new Logger(MarzbanService.name);

  constructor(
    private readonly authService: MarzbanAuthService,
    private readonly certificateService: MarzbanCertificateService,
    private readonly nodeService: MarzbanNodeService,
    private readonly userService: MarzbanUserService,
  ) {}

  /**
   * Тяжёлая работа не блокирует поднятие Nest: панель может стартовать позже приложения.
   */
  async onModuleInit(): Promise<void> {
    void this.runDeferredInitialization().catch((error: unknown) => {
      this.logger.error(
        'Marzban deferred initialization failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    });
  }

  private async runDeferredInitialization(): Promise<void> {
    try {
      const loggedIn = await this.login();
      if (!loggedIn) {
        this.logger.error(
          'Failed to login to Marzban API, skipping initialization',
        );
        return;
      }
      await this.fetchAndSaveCert();
      await this.registerInfrastructureNodes();
    } catch (error) {
      this.logger.error(
        'Failed to initialize Marzban service:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Login to Marzban API
   */
  async login(): Promise<boolean> {
    return this.authService.login();
  }

  /**
   * Fetch SSL certificate from Marzban Master and save it locally
   */
  private async fetchAndSaveCert(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.logger.warn('Cannot fetch certificate: not authenticated');
      return;
    }
    await this.certificateService.fetchAndSaveCert();
  }

  /**
   * Register infrastructure nodes from INFRASTRUCTURE_IP_LIST
   */
  private async registerInfrastructureNodes(): Promise<void> {
    await this.nodeService.registerInfrastructureNodes();
  }

  /**
   * Create a new user in Marzban with traffic limit and expiry
   */
  async createUser(
    telegramId: string,
    months: number,
  ): Promise<CreateUserResult> {
    try {
      if (!this.authService.isAuthenticated()) {
        const loggedIn = await this.login();
        if (!loggedIn) {
          return {
            success: false,
            error: 'Not authenticated with Marzban API',
          };
        }
      }

      let result = await this.userService.createUser(telegramId, months);

      if (!result.success && result.unauthorized) {
        this.logger.log('Marzban API returned 401, re-authenticating...');
        const loggedIn = await this.login();
        if (loggedIn) {
          result = await this.userService.createUser(telegramId, months);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        'Failed to create Marzban user:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Disable user access in the panel (status disabled).
   */
  async suspendUser(telegramId: string): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      const loggedIn = await this.login();
      if (!loggedIn) {
        return false;
      }
    }

    const first = await this.userService.suspendUser(telegramId);
    if (first.ok === true) {
      return true;
    }
    if (first.unauthorized !== true) {
      return false;
    }
    const loggedIn = await this.login();
    if (!loggedIn) {
      return false;
    }
    const second = await this.userService.suspendUser(telegramId);
    return second.ok;
  }
}
