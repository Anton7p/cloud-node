import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RentalsService } from '../rentals/rentals.service';
import { AppConfig } from '../../shared/config/configuration';

export interface PaymentResult {
  success: boolean;
  message?: string;
  rentalId?: number;
}

/**
 * PaymentService - заглушка для платежной системы
 *
 * Features:
 * - Обработка бесплатного триала (конфигурируемые дни)
 * - Проверка использования триала ранее
 * - Заглушки для платных тарифов
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly rentalsService: RentalsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Получение настроек триала из конфигурации
   */
  private getTrialConfig() {
    return {
      days:
        this.configService.get<AppConfig['trialDays']>('app.trialDays') || 3,
      ipLimit:
        this.configService.get<AppConfig['trialIpLimit']>('app.trialIpLimit') ||
        2,
    };
  }

  /**
   * Проверка, использовал ли пользователь триал ранее
   */
  async hasUsedTrial(telegramId: number): Promise<boolean> {
    // Проверяем наличие любой активной или завершенной аренды
    const rental = await this.rentalsService.getRental(telegramId);
    return rental !== null;
  }

  /**
   * Обработка бесплатного триала
   * Создает аренду на trialDays с лимитом trialIpLimit устройств
   */
  async processTrial(telegramId: number): Promise<PaymentResult> {
    const { days, ipLimit } = this.getTrialConfig();

    try {
      const hasTrial = await this.hasUsedTrial(telegramId);
      if (hasTrial) {
        return {
          success: false,
          message:
            'Вы уже использовали бесплатный период. Выберите платный тариф.',
        };
      }

      // Конвертируем дни в месяцы (приблизительно) для совместимости
      const termInMonths = days / 30;

      // Создаем pending аренду (fire and forget, result not needed)
      await this.rentalsService.createPendingRental(telegramId, termInMonths);

      // Активируем аренду
      const activatedRental =
        await this.rentalsService.activateRental(telegramId);

      if (!activatedRental) {
        return {
          success: false,
          message:
            'Не удалось активировать бесплатный период. Попробуйте позже.',
        };
      }

      this.logger.log(
        `Created trial rental for user ${telegramId}, rentalId: ${activatedRental.id}, ` +
          `days: ${days}, ipLimit: ${ipLimit}`,
      );

      return {
        success: true,
        rentalId: activatedRental.id,
        message: `Бесплатный период активирован на ${days} дня!`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create trial rental for ${telegramId}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return {
        success: false,
        message: 'Ошибка при создании бесплатного периода.',
      };
    }
  }

  /**
   * Legacy method alias for backward compatibility
   */
  async createTrialRental(telegramId: number): Promise<PaymentResult> {
    return this.processTrial(telegramId);
  }

  /**
   * Заглушка для оплаты недели
   */
  async processWeekPayment(telegramId: number): Promise<PaymentResult> {
    this.logger.log(`Week payment stub called for user ${telegramId}`);
    return {
      success: false,
      message:
        'Оплата временно недоступна, воспользуйтесь бесплатным периодом.',
    };
  }

  /**
   * Заглушка для оплаты месяца
   */
  async processMonthPayment(
    telegramId: number,
    months: number,
  ): Promise<PaymentResult> {
    this.logger.log(
      `Month payment stub called for user ${telegramId}, months: ${months}`,
    );
    return {
      success: false,
      message:
        'Оплата временно недоступна, воспользуйтесь бесплатным периодом.',
    };
  }
}
