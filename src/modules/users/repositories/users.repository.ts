import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { User } from '@prisma/client';

export type UserStatus = 'active' | 'expired';
export type UserSubscriptionType = 'free' | 'premium';

export const DEFAULT_USER_STATUS: UserStatus = 'active';
export const DEFAULT_SUBSCRIPTION_TYPE: UserSubscriptionType = 'free';

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
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
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
}
