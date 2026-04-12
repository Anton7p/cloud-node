import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import { MESSAGES, ACTIONS, mainKeyboard } from '../../ui';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [ACTIONS.START_MENU, 'start'];

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
    await this.sendMainMenu(ctx);
  }

  /**
   * Отправляет главное меню с inline-клавиатурой
   */
  private async sendMainMenu(ctx: CommandContext['ctx']): Promise<void> {
    await ctx.reply(MESSAGES.MAIN_TITLE, {
      reply_markup: mainKeyboard().reply_markup,
    });
  }
}
