import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import { MESSAGES, ACTIONS, mainKeyboard } from '../../ui';
import { UsersService } from '../../../users/users.service';
import { RentalsService } from '../../../rentals/rentals.service';
import dayjs from 'dayjs';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [ACTIONS.START_MENU, 'start'];

  constructor(
    private readonly usersService: UsersService,
    private readonly rentalsService: RentalsService,
  ) {
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

    // Проверяем активную подписку
    const activeRental = await this.rentalsService.getActiveRental(userId);
    const hasSubscription = !!activeRental;
    const expiryDate = activeRental?.endDate
      ? dayjs(activeRental.endDate).format('DD.MM.YYYY')
      : undefined;

    // Режим одного окна: всегда удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);
    await this.sendMainMenu(ctx, user.first_name, hasSubscription, expiryDate);
  }

  /**
   * Отправляет главное меню с inline-клавиатурой
   */
  private async sendMainMenu(
    ctx: CommandContext['ctx'],
    firstName: string,
    hasSubscription: boolean,
    expiryDate?: string,
  ): Promise<void> {
    const caption = MESSAGES.MAIN_TITLE(firstName, hasSubscription, expiryDate);
    await ctx.reply(caption, {
      reply_markup: mainKeyboard().reply_markup,
    });
  }
}
