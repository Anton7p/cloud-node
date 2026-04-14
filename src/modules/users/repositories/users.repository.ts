import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { User } from '@prisma/client';

export type UserStatus = 'active' | 'expired';
export type UserSubscriptionType = 'free' | 'premium';

export const DEFAULT_USER_STATUS: UserStatus = 'active';
export const DEFAULT_SUBSCRIPTION_TYPE: UserSubscriptionType = 'free';
export const PREMIUM_SUBSCRIPTION_TYPE: UserSubscriptionType = 'premium';
export const EXPIRED_USER_STATUS: UserStatus = 'expired';

export interface CreateUserData {
  telegramId: number;
  username?: string;
  firstName?: string;
  languageCode?: string;
  status?: UserStatus;
  subscriptionType?: UserSubscriptionType;
}

/**
 * DTO для обновления пользователя
 * Запрещает обновление системных полей
 */
export interface UpdateUserDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  status?: UserStatus;
  subscriptionType?: UserSubscriptionType;
  expiresAt?: Date;
  lastActivityAt?: Date;
}

/**
 * UsersRepository - изоляция доступа к данным пользователей
 *
 * Репозиторий полностью инкапсулирует работу с Prisma:
 * - Конвертирует telegramId в BigInt
 * - Обрабатывает ошибки БД
 * - Предоставляет чистый интерфейс для сервисного слоя
 * - Не зависит от Telegram API (telegramId используется как внешний идентификатор)
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создание нового пользователя
   */
  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        telegramId: BigInt(data.telegramId),
        username: data.username,
        firstName: data.firstName,
        languageCode: data.languageCode,
        status: data.status ?? DEFAULT_USER_STATUS,
        subscriptionType: data.subscriptionType ?? DEFAULT_SUBSCRIPTION_TYPE,
      },
    });

    this.logger.log(`Created user: ${data.telegramId}`);
    return user;
  }

  /**
   * Upsert пользователя (атомарная операция findOrCreate)
   */
  async upsert(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(data.telegramId) },
      update: {
        username: data.username,
        firstName: data.firstName,
        languageCode: data.languageCode,
        updatedAt: new Date(),
      },
      create: {
        telegramId: BigInt(data.telegramId),
        username: data.username,
        firstName: data.firstName,
        languageCode: data.languageCode,
        status: data.status ?? DEFAULT_USER_STATUS,
        subscriptionType: data.subscriptionType ?? DEFAULT_SUBSCRIPTION_TYPE,
      },
    });

    this.logger.log(`Upserted user: ${data.telegramId}`);
    return user;
  }

  /**
   * Поиск пользователя по telegramId
   */
  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
  }

  /**
   * Поиск всех пользователей
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Обновление пользователя
   */
  async update(
    telegramId: number,
    updates: UpdateUserDto,
  ): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: updates,
      });

      this.logger.log(`Updated user: ${telegramId}`);
      return user;
    } catch (error) {
      // Prisma error P2025: Record to update does not exist
      this.logger.warn(
        `User not found for update: ${telegramId}`,
        error instanceof Error ? error.message : '',
      );
      return null;
    }
  }

  /**
   * Обновление статуса пользователя
   */
  async updateStatus(
    telegramId: number,
    status: UserStatus,
  ): Promise<User | null> {
    return this.update(telegramId, { status });
  }

  /**
   * Обновление типа подписки
   */
  async updateSubscriptionType(
    telegramId: number,
    subscriptionType: UserSubscriptionType,
  ): Promise<User | null> {
    return this.update(telegramId, { subscriptionType });
  }

  /**
   * Обновление подписки с датой окончания
   * Примечание: расчет даты перенесен в UsersService (кумулятивное продление)
   */
  async updateSubscription(
    telegramId: number,
    expiresAt: Date,
  ): Promise<User | null> {
    return this.update(telegramId, {
      subscriptionType: PREMIUM_SUBSCRIPTION_TYPE,
      status: DEFAULT_USER_STATUS,
      expiresAt,
    });
  }

  /**
   * Удаление пользователя
   */
  async delete(telegramId: number): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { telegramId: BigInt(telegramId) },
      });

      this.logger.log(`Deleted user: ${telegramId}`);
      return true;
    } catch (error) {
      // Prisma error P2025: Record to delete does not exist
      this.logger.warn(
        `Attempted to delete non-existent user: ${telegramId}`,
        error instanceof Error ? error.message : '',
      );
      return false;
    }
  }

  /**
   * Обновление времени последнего взаимодействия (updatedAt)
   */
  async touch(telegramId: number): Promise<void> {
    await this.prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { updatedAt: new Date() },
    });
  }

  /**
   * Получение статистики пользователей
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    free: number;
    premium: number;
  }> {
    // Use $transaction for atomic multi-query execution
    const [total, active, expired, free, premium] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: DEFAULT_USER_STATUS } }),
        this.prisma.user.count({ where: { status: EXPIRED_USER_STATUS } }),
        this.prisma.user.count({
          where: { subscriptionType: DEFAULT_SUBSCRIPTION_TYPE },
        }),
        this.prisma.user.count({
          where: { subscriptionType: PREMIUM_SUBSCRIPTION_TYPE },
        }),
      ]);

    return { total, active, expired, free, premium };
  }
}
