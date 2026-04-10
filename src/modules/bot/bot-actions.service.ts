import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BotContext } from './types/bot.types';
import { BaseAction, createCommandContext } from './application/base.action';
import { COMMON_MESSAGES } from './ui';

// Импорты всех команд для регистрации в Map
import { StartCommand } from './application/commands/start.command';
import { ProfileCommand } from './application/commands/profile.command';
import { RentServerCommand } from './application/commands/rent-server.command';
import { RentTermCommand } from './application/commands/rent-term.command';
import { PayRentalCommand } from './application/commands/pay-rental.command';
import { GetAccessCommand } from './application/commands/get-access.command';
import { InstructionsCommand } from './application/commands/instructions.command';
import { PlatformInstructionCommand } from './application/commands/platform-instruction.command';
import { ReferralCommand } from './application/commands/referral.command';
import { HelpCommand } from './application/commands/help.command';

/**
 * BotActionsService - роутер команд на основе Map (O(1) lookup)
 *
 * Чистая Архитектура:
 * - Не содержит бизнес-логики
 * - Только маршрутизация: мгновенный поиск handler по ключу
 *
 * Open/Closed Principle:
 * - Для добавления новой команды: добавить импорт и регистрацию в buildHandlerMap()
 * - Используется Map для мгновенного роутинга вместо линейного поиска
 */
@Injectable()
export class BotActionsService implements OnModuleInit {
  private readonly logger = new Logger(BotActionsService.name);
  private readonly handlerMap = new Map<string, BaseAction>();
  private readonly patternHandlers: BaseAction[] = [];

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit(): Promise<void> {
    await this.buildHandlerMap();
    this.logger.log(
      `Initialized with ${this.handlerMap.size} direct handlers and ${this.patternHandlers.length} pattern handlers`,
    );
  }

  /**
   * Строит Map обработчиков для мгновенного роутинга
   * Строковые паттерны → Map, RegExp → массив для перебора
   * Оптимизировано: параллельное разрешение зависимостей
   */
  private async buildHandlerMap(): Promise<void> {
    const handlerClasses = [
      StartCommand,
      ProfileCommand,
      RentServerCommand,
      RentTermCommand,
      PayRentalCommand,
      GetAccessCommand,
      InstructionsCommand,
      PlatformInstructionCommand,
      ReferralCommand,
      HelpCommand,
    ];

    const handlers = await Promise.all(
      handlerClasses.map((cls) => this.moduleRef.get(cls, { strict: false })),
    );

    for (const handler of handlers) {
      this.registerHandler(handler);
    }
  }

  /**
   * Регистрирует handler в Map или массив pattern handlers
   */
  private registerHandler(handler: BaseAction): void {
    const { pattern } = handler;

    if (typeof pattern === 'string') {
      // Прямой mapping для строковых паттернов
      this.handlerMap.set(pattern, handler);
    } else if (Array.isArray(pattern)) {
      // Множественные строковые паттерны
      for (const key of pattern) {
        this.handlerMap.set(key, handler);
      }
    } else if (pattern instanceof RegExp) {
      // RegExp паттерны идут в отдельный массив
      this.patternHandlers.push(handler);
    }
  }

  /**
   * Мгновенный поиск handler по callback data
   * O(1) для строковых ключей, O(n) только для RegExp паттернов
   */
  private findHandler(data: string): BaseAction | undefined {
    // Сначала ищем прямой mapping
    const directHandler = this.handlerMap.get(data);
    if (directHandler) {
      return directHandler;
    }

    // Затем проверяем RegExp паттерны
    return this.patternHandlers.find((handler) => handler.canHandle(data));
  }

  /**
   * Обработка команды /start
   */
  async handleStart(ctx: BotContext): Promise<void> {
    const userId = ctx.from?.id || 0;
    const handler = this.findHandler('start');

    if (handler) {
      const context = createCommandContext(ctx, userId, 'start', handler);
      await handler.execute(context);
    } else {
      this.logger.error('No handler found for "start" command');
      await ctx.reply(COMMON_MESSAGES.UNKNOWN_COMMAND);
    }
  }

  /**
   * Обработка callback query
   * Паттерн Command/Handler: находим handler за O(1) и выполняем
   */
  async handleCallbackQuery(
    ctx: BotContext,
    data: string,
    userId: number,
  ): Promise<void> {
    this.logger.log(`Processing: ${data} from user ${userId}`);

    const handler = this.findHandler(data);

    if (handler) {
      const context = createCommandContext(ctx, userId, data, handler);
      await handler.execute(context);
    } else {
      this.logger.warn(`No handler for: ${data}`);
      await ctx.reply(COMMON_MESSAGES.UNKNOWN_COMMAND);
    }
  }
}
