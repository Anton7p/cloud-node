import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import {
  UsersRepository,
  CreateUserData,
  UserStatus,
  UserSubscriptionType,
} from './repositories/users.repository';

export { CreateUserData, UserStatus, UserSubscriptionType };

/**
 * UsersService - бизнес-логика управления пользователями
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {
    this.logger.log('UsersService initialized');
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepository.findByTelegramId(telegramId);
  }

  async findOrCreate(
    telegramId: number,
    data?: Partial<CreateUserData>,
  ): Promise<User> {
    return this.usersRepository.upsert({
      telegramId,
      ...data,
    });
  }

  async touch(telegramId: number): Promise<void> {
    await this.usersRepository.touch(telegramId);
  }
}
