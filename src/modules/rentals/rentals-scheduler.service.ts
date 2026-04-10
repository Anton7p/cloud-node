import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RentalsService } from './rentals.service';

/**
 * RentalsSchedulerService - планировщик задач для аренд серверов
 *
 * Features:
 * - Retention: уведомления об истекающих арендах
 * - Analytics: сбор статистики
 */
@Injectable()
export class RentalsSchedulerService {
  private readonly logger = new Logger(RentalsSchedulerService.name);

  constructor(private readonly rentalsService: RentalsService) {}

  /**
   * Cron задача: поиск аренд, истекающих через 24 часа
   * Запускается каждый час
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiringRentals(): Promise<void> {
    this.logger.log('Checking for expiring server rentals...');

    try {
      // Ищем аренды, истекающие в ближайшие 24 часа
      const expiringRentals = await this.rentalsService.findExpiringRentals(24);

      if (expiringRentals.length === 0) {
        this.logger.log('No expiring rentals found');
        return;
      }

      // Логируем ID пользователей с истекающими арендами
      const userIds = expiringRentals.map((r) => r.userId).join(', ');
      this.logger.warn(
        `Found ${expiringRentals.length} rentals expiring within 24h. User IDs: ${userIds}`,
      );

      // TODO: Отправка уведомлений пользователям
      // TODO: Обновление lastNotifiedAt
    } catch (error) {
      this.logger.error(`Failed to check expiring rentals: ${error}`);
    }
  }

  /**
   * Cron задача: ежедневная проверка просроченных аренд
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredRentals(): Promise<void> {
    this.logger.log('Checking for expired server rentals...');
    // TODO: Автоматическая деактивация просроченных аренд
  }
}
