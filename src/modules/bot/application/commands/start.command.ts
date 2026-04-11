import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from '../../../users/users.service';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, IMAGES, mainKeyboard } from '../../ui';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [ACTIONS.BACK_TO_MAIN, 'start'];

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

    // Регистрация пользователя
    await this.usersService.findOrCreate(userId, {
      telegramId: userId,
      username: user.username,
      firstName: user.first_name,
      languageCode: user.language_code,
      status: 'active',
      subscriptionType: 'free',
    });

    // Отправляем главное меню с фото
    await this.sendMainMenu(ctx);
  }

  /**
   * Отправляет главное меню с фото и inline-клавиатурой
   */
  private async sendMainMenu(ctx: CommandContext['ctx']): Promise<void> {
    try {
      const imagePath = path.resolve(IMAGES.START_HUD);

      if (fs.existsSync(imagePath)) {
        // Отправляем фото с caption и клавиатурой
        await ctx.replyWithPhoto(
          { source: imagePath },
          {
            caption: MESSAGES.MAIN_TITLE,
            reply_markup: mainKeyboard().reply_markup,
          },
        );
      } else {
        // Если фото нет - отправляем текст с клавиатурой
        await ctx.reply(MESSAGES.MAIN_TITLE, {
          reply_markup: mainKeyboard().reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send main menu: ${error}`);
      // Fallback на текстовое сообщение
      await ctx.reply(MESSAGES.MAIN_TITLE, {
        reply_markup: mainKeyboard().reply_markup,
      });
    }
  }
}
