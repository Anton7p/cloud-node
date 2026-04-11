import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from '../../../users/users.service';
import { BaseAction, CommandContext } from '../base.action';
import {
  START_MESSAGES,
  START_ACTIONS,
  startKeyboard,
  removeReplyKeyboard,
  HUD_ICONS,
} from '../../ui';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [START_ACTIONS.BACK_TO_START, 'start', 'launch_system'];

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

    // Typing эффект для атмосферы
    await ctx.sendChatAction('typing');

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

    // Удаляем reply keyboard для показа системной кнопки Старт
    await ctx.reply(START_MESSAGES.INIT, {
      reply_markup: removeReplyKeyboard().reply_markup,
      parse_mode: 'Markdown',
    });

    // Отправка HUD баннера
    await this.sendBanner(ctx);

    // Отправка сообщения с inline keyboard (без reply keyboard)
    await ctx.reply(START_MESSAGES.WELCOME(user.first_name), {
      reply_markup: startKeyboard().reply_markup,
      parse_mode: 'Markdown',
    });
  }

  /**
   * Отправляет HUD баннер если файл существует
   */
  private async sendBanner(ctx: CommandContext['ctx']): Promise<void> {
    try {
      const bannerPath = path.resolve(HUD_ICONS.BANNER);
      if (fs.existsSync(bannerPath)) {
        await ctx.replyWithPhoto({ source: bannerPath });
      }
    } catch (error) {
      this.logger.warn(`Failed to send banner: ${error}`);
      // Баннер не критичен, продолжаем без него
    }
  }
}
