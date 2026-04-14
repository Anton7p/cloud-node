import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RentalStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RentalsService } from './rentals.service';
import dayjs from 'dayjs';

/**
 * RentalsSchedulerService - планировщик задач для аренд серверов
 *
 * Features:
 * - Retention: уведомления об истекающих арендах (раз в 24ч)
 * - Auto-expiration: автоматическое отключение просроченных аренд
 * - Analytics: сбор статистики
 */
@Injectable()
export class RentalsSchedulerService {
  private readonly logger = new Logger(RentalsSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rentalsService: RentalsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Cron задача: поиск аренд, истекающих через 24 часа
   * Запускается каждый час
   * Обновляет lastNotifiedAt для предотвращения спама
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiringRentals(): Promise<void> {
    this.logger.log('Checking for expiring server rentals...');

    try {
      const now = dayjs();
      const cutoff = now.add(24, 'hour').toDate();
      const lastNotificationThreshold = now.subtract(24, 'hour').toDate();

      // Ищем аренды, истекающие в ближайшие 24 часа
      // Исключаем те, по которым уже отправляли уведомление за последние 24 часа
      const expiringRentals = await this.prisma.rental.findMany({
        where: {
          status: RentalStatus.ACTIVE,
          endDate: {
            gt: now.toDate(),
            lte: cutoff,
          },
          OR: [
            { lastNotifiedAt: null },
            { lastNotifiedAt: { lt: lastNotificationThreshold } },
          ],
        },
        include: { user: true },
      });

      if (expiringRentals.length === 0) {
        this.logger.log('No expiring rentals found');
        return;
      }

      this.logger.warn(
        `Found ${expiringRentals.length} rentals expiring within 24h`,
      );

      // Обновляем lastNotifiedAt для всех найденных аренд
      const rentalIds = expiringRentals.map((r) => r.id);
      await this.prisma.rental.updateMany({
        where: { id: { in: rentalIds } },
        data: { lastNotifiedAt: now.toDate() },
      });

      // TODO: Отправка уведомлений пользователям через BotService
      this.logger.log(`Updated lastNotifiedAt for ${rentalIds.length} rentals`);
    } catch (error) {
      this.logger.error(`Failed to check expiring rentals: ${error}`);
    }
  }

  /**
   * Cron задача: ежедневная проверка просроченных аренд
   * Меняет статус на EXPIRED и вызывает suspendUser у провайдера
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredRentals(): Promise<void> {
    this.logger.log('Checking for expired server rentals...');

    try {
      const now = dayjs().toDate();

      // Находим все просроченные активные аренды
      const expiredRentals = await this.prisma.rental.findMany({
        where: {
          status: RentalStatus.ACTIVE,
          endDate: { lt: now },
        },
        include: { user: true },
      });

      if (expiredRentals.length === 0) {
        this.logger.log('No expired rentals found');
        return;
      }

      this.logger.warn(
        `Found ${expiredRentals.length} expired rentals to deactivate`,
      );

      // Деактивируем каждую просроченную аренду
      for (const rental of expiredRentals) {
        try {
          // Меняем статус на EXPIRED
          await this.prisma.rental.update({
            where: { id: rental.id },
            data: { status: RentalStatus.EXPIRED },
          });

          // Эмитируем событие для приостановки пользователя в Marzban
          if (rental.user?.telegramId) {
            const telegramIdNum = Number(rental.user.telegramId);
            this.eventEmitter.emit('rental.expired', {
              rentalId: rental.id,
              userId: rental.user.id,
              telegramId: telegramIdNum,
            });
            this.logger.log(
              `Emitted rental.expired for user ${telegramIdNum} (rental ${rental.id})`,
            );
          }

          this.logger.log(`Deactivated expired rental: ${rental.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to deactivate rental ${rental.id}:`,
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      }

      this.logger.log(
        `Successfully deactivated ${expiredRentals.length} expired rentals`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check expired rentals:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }
}
