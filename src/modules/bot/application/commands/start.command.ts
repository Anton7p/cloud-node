import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import { MESSAGES, mainKeyboard } from '../../ui';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class StartCommand extends BaseAction {
  // Регулярное выражение для: 'start', 'start_menu', 'show_main_menu', и 'start <payload>'
  readonly pattern = /^(start|start_menu|show_main_menu)(\s+.*)?$/;

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

    // Отправляем главное меню с фото
    await this.sendMainMenu(ctx);
  }

  /**
   * Отправляет главное меню с фото и inline-клавиатурой
   */
  private async sendMainMenu(ctx: CommandContext['ctx']): Promise<void> {
    const imagePath = path.join(
      process.cwd(),
      'assets',
      'images',
      'start_hud.jpg',
    );

    await ctx.replyWithPhoto(
      { source: imagePath },
      {
        caption: MESSAGES.MAIN_TITLE,
        reply_markup: mainKeyboard().reply_markup,
        parse_mode: 'HTML',
      },
    );
  }
}
