import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Rental, RentalStatus } from '@prisma/client';

export { RentalStatus } from '@prisma/client';

export interface CreateRentalData {
  userId: number;
  term: number;
  status?: RentalStatus;
}

export interface RentalData {
  userId: number;
  term: number;
  status: RentalStatus;
  startDate?: Date;
  endDate?: Date;
}

/**
 * RentalsRepository - изоляция доступа к данным аренды
 *
 * Репозиторий полностью инкапсулирует работу с Prisma:
 * - Управление статусами аренды (pending → active → expired)
 * - Работа с датами начала и окончания
 * - Связь с пользователем через userId
 * - Не зависит от Telegram API
 */
@Injectable()
export class RentalsRepository {
  private readonly logger = new Logger(RentalsRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создание новой аренды со статусом pending
   */
  async createPending(userId: number, term: number): Promise<Rental> {
    // Сначала деактивируем существующие pending аренды этого пользователя
    await this.deactivateExistingPending(userId);

    const rental = await this.prisma.rental.create({
      data: {
        userId,
        term,
        status: RentalStatus.PENDING,
      },
    });

    this.logger.log(
      `Created pending rental for user ${userId}, term: ${term} months`,
    );
    return rental;
  }

  /**
   * Активация pending аренды (с продлением существующей active если не просрочена)
   */
  async activate(userId: number): Promise<Rental | null> {
    const pendingRental = await this.findPendingByUserId(userId);

    if (!pendingRental) {
      this.logger.warn(`No pending rental found for user ${userId}`);
      return null;
    }

    const now = new Date();
    const activeRental = await this.findActiveByUserId(userId);

    // Если есть активная аренда и она НЕ просрочена - продлеваем её
    if (activeRental && activeRental.endDate && activeRental.endDate > now) {
      const newTerm = activeRental.term + pendingRental.term;
      const newEndDate = new Date(activeRental.endDate);
      newEndDate.setMonth(newEndDate.getMonth() + pendingRental.term);

      // Удаляем pending аренду (не нужна, т.к. продлеваем существующую)
      await this.prisma.rental.delete({ where: { id: pendingRental.id } });

      // Продлеваем активную аренду
      const updated = await this.prisma.rental.update({
        where: { id: activeRental.id },
        data: {
          term: newTerm,
          endDate: newEndDate,
        },
      });

      this.logger.log(
        `Extended rental ${updated.id} for user ${userId}, new term: ${newTerm} months, expires: ${newEndDate.toISOString()}`,
      );
      return updated;
    }

    // Если активной нет или она просрочена - активируем pending как новую
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + pendingRental.term);

    const updated = await this.prisma.rental.update({
      where: { id: pendingRental.id },
      data: {
        status: RentalStatus.ACTIVE,
        startDate: now,
        endDate,
      },
    });

    this.logger.log(
      `Activated rental ${updated.id} for user ${userId}, expires: ${endDate.toISOString()}`,
    );
    return updated;
  }

  /**
   * Получение активной аренды пользователя
   */
  async findActiveByUserId(userId: number): Promise<Rental | null> {
    return this.prisma.rental.findFirst({
      where: {
        userId,
        status: RentalStatus.ACTIVE,
      },
    });
  }

  /**
   * Получение pending аренды пользователя
   */
  async findPendingByUserId(userId: number): Promise<Rental | null> {
    return this.prisma.rental.findFirst({
      where: {
        userId,
        status: RentalStatus.PENDING,
      },
    });
  }

  /**
   * Получение любой аренды пользователя (active или pending)
   */
  async findByUserId(userId: number): Promise<Rental | null> {
    return this.prisma.rental.findFirst({
      where: {
        userId,
        status: { in: [RentalStatus.ACTIVE, RentalStatus.PENDING] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Проверка наличия активной аренды
   */
  async hasActive(userId: number): Promise<boolean> {
    const count = await this.prisma.rental.count({
      where: {
        userId,
        status: RentalStatus.ACTIVE,
      },
    });
    return count > 0;
  }

  /**
   * Проверка наличия pending аренды
   */
  async hasPending(userId: number): Promise<boolean> {
    const count = await this.prisma.rental.count({
      where: {
        userId,
        status: RentalStatus.PENDING,
      },
    });
    return count > 0;
  }

  /**
   * Удаление аренды
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.rental.delete({
        where: { id },
      });
      this.logger.log(`Deleted rental: ${id}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Деактивация существующих pending аренд пользователя
   * (для предотвращения конфликтов при создании новой)
   */
  private async deactivateExistingPending(userId: number): Promise<void> {
    await this.prisma.rental.updateMany({
      where: {
        userId,
        status: RentalStatus.PENDING,
      },
      data: {
        status: RentalStatus.EXPIRED,
      },
    });
  }

  /**
   * Деактивация существующей active аренды пользователя
   * (для предотвращения unique constraint при активации новой)
   */
  private async deactivateExistingActive(userId: number): Promise<void> {
    await this.prisma.rental.updateMany({
      where: {
        userId,
        status: RentalStatus.ACTIVE,
      },
      data: {
        status: RentalStatus.EXPIRED,
      },
    });
  }

  /**
   * Получение всех активных аренд
   */
  async findAllActive(): Promise<Rental[]> {
    return this.prisma.rental.findMany({
      where: { status: RentalStatus.ACTIVE },
      include: { user: true },
    });
  }
}
