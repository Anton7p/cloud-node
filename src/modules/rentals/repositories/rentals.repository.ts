import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { Rental, RentalStatus } from '@prisma/client';

export { RentalStatus } from '@prisma/client';

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

  async findById(id: number): Promise<Rental | null> {
    return this.prisma.rental.findUnique({ where: { id } });
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
}
