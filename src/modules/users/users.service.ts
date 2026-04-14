import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import dayjs from 'dayjs';
import {
  UsersRepository,
  CreateUserData,
  UpdateUserDto,
  UserStatus,
  UserSubscriptionType,
} from './repositories/users.repository';

export { CreateUserData, UpdateUserDto, UserStatus, UserSubscriptionType };

/**
 * UsersService - бизнес-логика управления пользователями
 *
 * Чистая Архитектура:
 * - Содержит только бизнес-логику
 * - Работа с БД делегирована UsersRepository
 * - Не зависит от Telegram API
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {
    this.logger.log('UsersService initialized');
  }

  async create(data: CreateUserData): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepository.findByTelegramId(telegramId);
  }

  async findOrCreate(
    telegramId: number,
    data?: Partial<CreateUserData>,
  ): Promise<User> {
    // Используем атомарный upsert для предотвращения race conditions
    return this.usersRepository.upsert({
      telegramId,
      ...data,
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async update(
    telegramId: number,
    updates: UpdateUserDto,
  ): Promise<User | null> {
    return this.usersRepository.update(telegramId, updates);
  }

  async updateStatus(
    telegramId: number,
    status: UserStatus,
  ): Promise<User | null> {
    return this.usersRepository.updateStatus(telegramId, status);
  }

  async updateSubscriptionType(
    telegramId: number,
    subscriptionType: UserSubscriptionType,
  ): Promise<User | null> {
    return this.usersRepository.updateSubscriptionType(
      telegramId,
      subscriptionType,
    );
  }

  async updateSubscription(
    telegramId: number,
    days: number,
  ): Promise<User | null> {
    // Find user to check current subscription status
    const user = await this.usersRepository.findByTelegramId(telegramId);
    if (!user) {
      this.logger.warn(`User not found for subscription update: ${telegramId}`);
      return null;
    }

    // Calculate new expiration date using cumulative renewal logic
    // If subscription is active (expiresAt in future), add days to expiresAt
    // If no subscription or expired, count from now
    const now = dayjs();
    const currentExpiresAt = user.expiresAt ? dayjs(user.expiresAt) : null;
    const hasActiveSubscription =
      currentExpiresAt && currentExpiresAt.isAfter(now);

    const baseDate = hasActiveSubscription ? currentExpiresAt : now;
    const newExpiresAt = baseDate.add(days, 'day').toDate();

    this.logger.log(
      `Updating subscription for ${telegramId}: ${days} days, ` +
        `baseDate=${baseDate.format('YYYY-MM-DD')}, ` +
        `newExpiresAt=${dayjs(newExpiresAt).format('YYYY-MM-DD')}`,
    );

    // Update subscription with calculated date
    return this.usersRepository.updateSubscription(telegramId, newExpiresAt);
  }

  async delete(telegramId: number): Promise<boolean> {
    return this.usersRepository.delete(telegramId);
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    free: number;
    premium: number;
  }> {
    return this.usersRepository.getStats();
  }

  /**
   * Обновление времени последнего взаимодействия пользователя
   */
  async touch(telegramId: number): Promise<void> {
    await this.usersRepository.touch(telegramId);
  }
}
