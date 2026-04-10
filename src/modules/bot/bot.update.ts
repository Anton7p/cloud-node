import { Update, Start, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Logger, UseFilters } from '@nestjs/common';
import { BotActionsService } from './bot-actions.service';
import { BotContext } from './types/bot.types';
import { UsersService } from '../users/users.service';
import { BotExceptionFilter } from './filters';

/**
 * BotUpdate - тонкий контроллер Telegram бота (Infrastructure Layer)
 *
 * Вся бизнес-логика вынесена в отдельные модули:
 * - UsersModule - управление пользователями
 * - RentalsModule - управление арендой
 * - BotModule UI - Telegram-специфичный слой
 *
 * BotExceptionFilter - отказоустойчивость: ошибки не приводят к "молчанию" бота
 */
@Update()
@UseFilters(BotExceptionFilter)
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly botActionsService: BotActionsService,
    private readonly usersService: UsersService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id;
    if (userId) {
      await this.usersService.touch(userId).catch(() => {
        // Игнорируем ошибки обновления активности
      });
    }
    await this.botActionsService.handleStart(ctx);
  }

  @On('callback_query')
  async onCallbackQuery(@Ctx() ctx: BotContext): Promise<void> {
    const callbackQuery = ctx.callbackQuery;

    if (!callbackQuery || !('data' in callbackQuery)) {
      await ctx.answerCbQuery().catch(() => {
        // Игнорируем ошибки ответа на callback
      });
      return;
    }

    const data = callbackQuery.data;
    const user = callbackQuery.from;

    this.logger.log(`Callback query from user ${user.id}: ${data}`);

    // Обновляем время последнего взаимодействия
    await this.usersService.touch(user.id).catch(() => {
      // Игнорируем ошибки обновления активности
    });

    try {
      await this.botActionsService.handleCallbackQuery(ctx, data, user.id);
    } finally {
      // Всегда отвечаем на callback, чтобы кнопка не "зависала"
      await ctx.answerCbQuery().catch(() => {
        this.logger.warn(`Failed to answer callback query for user ${user.id}`);
      });
    }
  }
}
