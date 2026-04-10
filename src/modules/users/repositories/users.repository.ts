import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { User } from '@prisma/client';

export type UserStatus = 'active' | 'expired';
export type UserSubscriptionType = 'free' | 'premium';

export interface CreateUserData {
  telegramId: number;
  username?: string;
  firstName?: string;
  languageCode?: string;
  status?: UserStatus;
  subscriptionType?: UserSubscriptionType;
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
        status: data.status ?? 'active',
        subscriptionType: data.subscriptionType ?? 'free',
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
        status: data.status ?? 'active',
        subscriptionType: data.subscriptionType ?? 'free',
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
    updates: Partial<Omit<User, 'id' | 'telegramId' | 'createdAt'>>,
  ): Promise<User | null> {
    const exists = await this.findByTelegramId(telegramId);
    if (!exists) {
      this.logger.warn(`User not found for update: ${telegramId}`);
      return null;
    }

    const user = await this.prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: updates,
    });

    this.logger.log(`Updated user: ${telegramId}`);
    return user;
  }

  /**
   * Обновление статуса пользователя
   */
  async updateStatus(telegramId: number, status: UserStatus): Promise<User | null> {
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
   */
  async updateSubscription(telegramId: number, days: number): Promise<User | null> {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + days);

    return this.update(telegramId, {
      subscriptionType: 'premium',
      status: 'active',
      expiresAt,
    });
  }

  /**
   * Удаление пользователя
   */
  async delete(telegramId: number): Promise<boolean> {
    const exists = await this.findByTelegramId(telegramId);
    if (!exists) {
      this.logger.warn(`Attempted to delete non-existent user: ${telegramId}`);
      return false;
    }

    await this.prisma.user.delete({
      where: { telegramId: BigInt(telegramId) },
    });

    this.logger.log(`Deleted user: ${telegramId}`);
    return true;
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
    const [total, active, expired, free, premium] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.user.count({ where: { status: 'expired' } }),
      this.prisma.user.count({ where: { subscriptionType: 'free' } }),
      this.prisma.user.count({ where: { subscriptionType: 'premium' } }),
    ]);

    return { total, active, expired, free, premium };
  }
}
