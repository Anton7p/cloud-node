import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Rental, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RentalsRepository } from './repositories/rentals.repository';
import { RentalData } from '../bot/types/bot.types';
import { UsersService } from '../users/users.service';
import dayjs from 'dayjs';

export { Rental, RentalStatus } from '@prisma/client';

/**
 * RentalsService - бизнес-логика управления арендой серверов
 *
 * Enterprise Features:
 * - Транзакционная активация с продлением
 * - Расчет дат через dayjs
 * - Автоматическая выдача Access Key
 * - События для интеграций
 */
@Injectable()
export class RentalsService {
  private readonly logger = new Logger(RentalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rentalsRepository: RentalsRepository,
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPendingRental(telegramId: number, term: number): Promise<Rental> {
    const user = await this.usersService.findOrCreate(telegramId);
    return this.rentalsRepository.createPending(user.id, term);
  }

  async getRental(telegramId: number): Promise<Rental | null> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) return null;
    return this.rentalsRepository.findByUserId(user.id);
  }

  /**
   * Активация аренды с транзакционной безопасностью
   * Логика: продлеваем активную или создаем новую
   */
  async activateRental(telegramId: number): Promise<Rental | null> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) {
      this.logger.warn(`User not found for activation: ${telegramId}`);
      return null;
    }

    const pendingRental = await this.rentalsRepository.findPendingByUserId(
      user.id,
    );
    if (!pendingRental) {
      this.logger.warn(`No pending rental found for user: ${telegramId}`);
      return null;
    }

    const now = dayjs();
    const activeRental = await this.rentalsRepository.findActiveByUserId(
      user.id,
    );

    // Транзакция: либо продлеваем активную, либо активируем новую
    const result = await this.prisma.$transaction(async (tx) => {
      // Если есть активная аренда и она не просрочена - продлеваем
      if (
        activeRental &&
        activeRental.endDate &&
        dayjs(activeRental.endDate).isAfter(now)
      ) {
        const newTerm = activeRental.term + pendingRental.term;
        const newEndDate = dayjs(activeRental.endDate).add(
          pendingRental.term,
          'month',
        );

        // Помечаем pending как COMPLETED (не удаляем для истории)
        await tx.rental.update({
          where: { id: pendingRental.id },
          data: { status: RentalStatus.COMPLETED },
        });

        // Продлеваем активную аренду
        const updated = await tx.rental.update({
          where: { id: activeRental.id },
          data: {
            term: newTerm,
            endDate: newEndDate.toDate(),
          },
        });

        this.logger.log(
          `Extended server rental ${updated.id} for user ${telegramId}, ` +
            `new term: ${newTerm} months, expires: ${newEndDate.format('YYYY-MM-DD')}`,
        );
        return updated;
      }

      // Если активной нет или просрочена - активируем pending
      const endDate = now.add(pendingRental.term, 'month');

      const updated = await tx.rental.update({
        where: { id: pendingRental.id },
        data: {
          status: RentalStatus.ACTIVE,
          startDate: now.toDate(),
          endDate: endDate.toDate(),
        },
      });

      this.logger.log(
        `Activated server rental ${updated.id} for user ${telegramId}, ` +
          `expires: ${endDate.format('YYYY-MM-DD')}`,
      );
      return updated;
    });

    // Эмитируем событие для интеграций
    if (result) {
      this.eventEmitter.emit('rental.activated', {
        rentalId: result.id,
        userId: result.userId,
        telegramId,
        term: result.term,
        endDate: result.endDate,
      });
    }

    return result;
  }

  async hasActiveRental(telegramId: number): Promise<boolean> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) return false;
    return this.rentalsRepository.hasActive(user.id);
  }

  async hasPendingRental(telegramId: number): Promise<boolean> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) return false;
    return this.rentalsRepository.hasPending(user.id);
  }

  async getActiveRental(telegramId: number): Promise<Rental | null> {
    const user = await this.usersService.findByTelegramId(telegramId);
    if (!user) return null;
    return this.rentalsRepository.findActiveByUserId(user.id);
  }

  async removeRental(id: number): Promise<boolean> {
    return this.rentalsRepository.delete(id);
  }

  async getAllRentals(): Promise<Rental[]> {
    return this.rentalsRepository.findAllActive();
  }

  /**
   * Поиск аренд с истекающим сроком (для Cron задач)
   */
  async findExpiringRentals(hours: number): Promise<Rental[]> {
    const cutoff = dayjs().add(hours, 'hour').toDate();
    const now = new Date();

    return this.prisma.rental.findMany({
      where: {
        status: RentalStatus.ACTIVE,
        endDate: {
          gt: now,
          lte: cutoff,
        },
        lastNotifiedAt: {
          lt: dayjs().subtract(1, 'day').toDate(),
          // Или null - будет обработано
        },
      },
      include: { user: true },
    });
  }

  /**
   * Обновление Access Key для аренды
   */
  async updateAccessKey(
    rentalId: number,
    accessKey: string,
  ): Promise<Rental | null> {
    try {
      const updated = await this.prisma.rental.update({
        where: { id: rentalId },
        data: { accessKey },
      });
      this.logger.log(`Updated Access Key for rental ${rentalId}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update Access Key for rental ${rentalId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Конвертация Rental из БД в RentalData для UI
   */
  toRentalData(rental: Rental | null): RentalData | undefined {
    if (!rental) return undefined;
    return {
      userId: rental.userId,
      term: rental.term,
      status: rental.status as RentalData['status'],
      startDate: rental.startDate || undefined,
      endDate: rental.endDate || undefined,
    };
  }
}
