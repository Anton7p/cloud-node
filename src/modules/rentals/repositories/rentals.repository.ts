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

export interface ExtendRentalData {
  id: number;
  additionalTerm: number;
  newEndDate: Date;
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
   * Атомарная операция: деактивирует существующие pending и создает новую
   */
  async createPending(userId: number, term: number): Promise<Rental> {
    return this.prisma.$transaction(async (tx) => {
      // Сначала деактивируем существующие pending аренды этого пользователя
      await tx.rental.updateMany({
        where: {
          userId,
          status: RentalStatus.PENDING,
        },
        data: {
          status: RentalStatus.EXPIRED,
        },
      });

      const rental = await tx.rental.create({
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
    });
  }

  /**
   * Создание новой активной аренды
   */
  async create(
    userId: number,
    term: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Rental> {
    const rental = await this.prisma.rental.create({
      data: {
        userId,
        term,
        status: RentalStatus.ACTIVE,
        startDate,
        endDate,
      },
    });

    this.logger.log(
      `Created active rental ${rental.id} for user ${userId}, expires: ${endDate.toISOString()}`,
    );
    return rental;
  }

  /**
   * Продление существующей аренды
   */
  async extend(data: ExtendRentalData): Promise<Rental> {
    const { id, additionalTerm, newEndDate } = data;

    const rental = await this.prisma.rental.update({
      where: { id },
      data: {
        term: { increment: additionalTerm },
        endDate: newEndDate,
      },
    });

    this.logger.log(
      `Extended rental ${rental.id}, new term: ${rental.term} months, expires: ${newEndDate.toISOString()}`,
    );
    return rental;
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
   * Оптимизировано: использует findFirst с select для экономии ресурсов БД
   */
  async hasActive(userId: number): Promise<boolean> {
    const rental = await this.prisma.rental.findFirst({
      where: {
        userId,
        status: RentalStatus.ACTIVE,
      },
      select: { id: true },
    });
    return rental !== null;
  }

  /**
   * Проверка наличия pending аренды
   * Оптимизировано: использует findFirst с select для экономии ресурсов БД
   */
  async hasPending(userId: number): Promise<boolean> {
    const rental = await this.prisma.rental.findFirst({
      where: {
        userId,
        status: RentalStatus.PENDING,
      },
      select: { id: true },
    });
    return rental !== null;
  }

  /**
   * Обновление статуса аренды
   */
  async updateStatus(id: number, status: RentalStatus): Promise<Rental | null> {
    try {
      const updated = await this.prisma.rental.update({
        where: { id },
        data: { status },
      });
      this.logger.log(`Updated rental ${id} status to ${status}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to update rental ${id} status:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Завершение аренды (мягкое удаление для сохранения истории)
   * Вместо физического удаления обновляет статус на COMPLETED
   */
  async complete(id: number): Promise<boolean> {
    try {
      await this.prisma.rental.update({
        where: { id },
        data: { status: RentalStatus.COMPLETED },
      });
      this.logger.log(`Completed rental: ${id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to complete rental ${id}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
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

  /**
   * Получение активных аренд с пагинацией (limit/offset)
   * @param limit - количество записей на странице
   * @param offset - смещение от начала
   * @returns массив активных аренд с информацией о пользователях
   */
  async findActivePaginated(limit: number, offset: number): Promise<Rental[]> {
    return this.prisma.rental.findMany({
      where: { status: RentalStatus.ACTIVE },
      include: { user: true },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получение общего количества активных аренд (для пагинации)
   * @returns количество активных аренд
   */
  async countActive(): Promise<number> {
    return this.prisma.rental.count({
      where: { status: RentalStatus.ACTIVE },
    });
  }

  /**
   * Поиск активных аренд с пагинацией и фильтрацией по пользователю
   * @param userId - ID пользователя (опционально)
   * @param limit - количество записей на странице
   * @param offset - смещение от начала
   * @returns массив активных аренд
   */
  async findActiveByUserIdPaginated(
    userId: number | undefined,
    limit: number,
    offset: number,
  ): Promise<Rental[]> {
    const where = {
      status: RentalStatus.ACTIVE,
      ...(userId && { userId }),
    };

    return this.prisma.rental.findMany({
      where,
      include: { user: true },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }
}
