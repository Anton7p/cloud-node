import { Update, Start, Ctx, On } from 'nestjs-telegraf';
import { Logger, UseFilters, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotActionsService } from './bot-actions.service';
import { BotContext } from './types/bot.types';
import { UsersService } from '../users/users.service';
import { BotExceptionFilter } from './filters';
import { MAIN_LAUNCH_BUTTON, CHAT_MENU_BUTTON } from './ui';

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
export class BotUpdate implements OnModuleInit {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly botActionsService: BotActionsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Установка глобальной кнопки меню при старте бота
   */
  async onModuleInit(): Promise<void> {
    try {
      const token = this.configService.get<string>('app.telegramBotToken');
      if (token) {
        // Используем прямой API вызов для установки menu button
        const response = await fetch(
          `https://api.telegram.org/bot${token}/setChatMenuButton`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menu_button: {
                type: 'commands',
                text: CHAT_MENU_BUTTON.text,
              },
            }),
          },
        );
        if (response.ok) {
          this.logger.log('Chat menu button configured successfully');
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to set chat menu button: ${error}`);
    }
  }

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

  /**
   * Обработка текстовых сообщений (для reply keyboard)
   */
  @On('text')
  async onText(@Ctx() ctx: BotContext): Promise<void> {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text;
    const userId = ctx.from?.id;

    // Проверяем, является ли сообщение нажатием главной кнопки
    if (text === MAIN_LAUNCH_BUTTON || text.includes('ЗАПУСТИТЬ СИСТЕМУ')) {
      this.logger.log(`Launch button pressed by user ${userId}`);
      if (userId) {
        await this.usersService.touch(userId).catch(() => {});
      }
      await this.botActionsService.handleStart(ctx);
    }
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
