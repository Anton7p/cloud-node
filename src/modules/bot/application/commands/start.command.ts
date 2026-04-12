import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import { MESSAGES, ACTIONS, mainKeyboard, startButtonKeyboard } from '../../ui';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [ACTIONS.START_MENU, ACTIONS.SHOW_MAIN_MENU, 'start'];

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

    // Режим одного окна: всегда удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);

    // Если это первый запуск (data === 'start'), показываем приветственный экран
    // Если нажата кнопка "Старт" (data === 'show_main_menu'), показываем главное меню
    if (context.data === 'start') {
      await this.sendWelcomeScreen(ctx);
    } else {
      await this.sendMainMenu(ctx);
    }
  }

  /**
   * Отправляет первый экран с фото и кнопкой "Старт"
   */
  private async sendWelcomeScreen(ctx: CommandContext['ctx']): Promise<void> {
    const imagePath = path.join(
      process.cwd(),
      'assets',
      'images',
      'start_hud.jpg',
    );

    await ctx.replyWithPhoto(
      { source: imagePath },
      {
        caption: MESSAGES.WELCOME_FIRST,
        reply_markup: startButtonKeyboard().reply_markup,
      },
    );
  }

  /**
   * Отправляет главное меню с текстом и inline-клавиатурой
   */
  private async sendMainMenu(ctx: CommandContext['ctx']): Promise<void> {
    await ctx.reply(MESSAGES.MAIN_TITLE, {
      reply_markup: mainKeyboard().reply_markup,
    });
  }
}
