import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { BaseAction, CommandContext } from '../base.action';
import { START_MESSAGES, START_ACTIONS, startKeyboard } from '../../ui';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [START_ACTIONS.BACK_TO_START, 'start'];

  constructor(private readonly usersService: UsersService) {
    super(StartCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    const user = ctx.from;

    if (!user) {
      this.logger.warn('No user data in context');
      return;
    }

    this.logExecution(context.data, userId);

    // Извлекаем реферальный код из start_payload (если есть)
    // @ts-expect-error Telegraf types
    const referralCode = ctx.startPayload || ctx.payload || '';

    // Используем upsert для атомарного создания/обновления
    await this.usersService.findOrCreate(userId, {
      telegramId: userId,
      username: user.username,
      firstName: user.first_name,
      languageCode: user.language_code,
      status: 'active',
      subscriptionType: 'free',
    });

    if (referralCode) {
      this.logger.log(
        `User ${userId} registered with referral code: ${referralCode}`,
      );
      // TODO: Обработка реферального кода
    }

    await ctx.reply(START_MESSAGES.WELCOME(user.first_name), startKeyboard());
  }
}
