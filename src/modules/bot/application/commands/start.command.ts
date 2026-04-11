import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { UsersService } from '../../../users/users.service';
import { RentalsService } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, IMAGES, mainKeyboard } from '../../ui';

@Injectable()
export class StartCommand extends BaseAction {
  readonly pattern = [ACTIONS.BACK_TO_MAIN, 'start'];

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

    // Если это callback (нажатие НАЗАД) - редактируем сообщение
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await this.editToMainMenu(
        ctx,
        user.first_name,
        hasSubscription,
        expiryDate,
      );
    } else {
      // Новое сообщение
      await this.sendMainMenu(
        ctx,
        user.first_name,
        hasSubscription,
        expiryDate,
      );
    }
  }

  /**
   * Отправляет главное меню с фото и inline-клавиатурой
   */
  private async sendMainMenu(
    ctx: CommandContext['ctx'],
    firstName: string,
    hasSubscription: boolean,
    expiryDate?: string,
  ): Promise<void> {
    try {
      const imagePath = path.resolve(IMAGES.START_HUD);
      const caption = MESSAGES.MAIN_TITLE(
        firstName,
        hasSubscription,
        expiryDate,
      );
      const keyboard = mainKeyboard(hasSubscription);

      if (fs.existsSync(imagePath)) {
        await ctx.replyWithPhoto(
          { source: imagePath },
          {
            caption,
            reply_markup: keyboard.reply_markup,
          },
        );
      } else {
        await ctx.reply(caption, {
          reply_markup: keyboard.reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send main menu: ${error}`);
      const caption = MESSAGES.MAIN_TITLE(
        firstName,
        hasSubscription,
        expiryDate,
      );
      await ctx.reply(caption, {
        reply_markup: mainKeyboard(hasSubscription).reply_markup,
      });
    }
  }

  /**
   * Редактирует текущее сообщение на главное меню (для навигации НАЗАД)
   */
  private async editToMainMenu(
    ctx: CommandContext['ctx'],
    firstName: string,
    hasSubscription: boolean,
    expiryDate?: string,
  ): Promise<void> {
    try {
      const imagePath = path.resolve(IMAGES.START_HUD);
      const caption = MESSAGES.MAIN_TITLE(
        firstName,
        hasSubscription,
        expiryDate,
      );
      const keyboard = mainKeyboard(hasSubscription);

      // Пробуем редактировать media
      if (fs.existsSync(imagePath)) {
        try {
          await ctx.editMessageMedia(
            {
              type: 'photo',
              media: { source: imagePath },
              caption,
            },
            { reply_markup: keyboard.reply_markup },
          );
        } catch {
          // Fallback на редактирование текста/caption
          await ctx.editMessageCaption(caption, {
            reply_markup: keyboard.reply_markup,
          });
        }
      } else {
        await ctx.editMessageText(caption, {
          reply_markup: keyboard.reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to edit main menu: ${error}`);
      // Fallback на новое сообщение
      await this.sendMainMenu(ctx, firstName, hasSubscription, expiryDate);
    }
  }
}
