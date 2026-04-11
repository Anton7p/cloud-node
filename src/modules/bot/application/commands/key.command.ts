import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, ACCESS_PRICES, durationKeyboard } from '../../ui';

@Injectable()
export class KeyCommand extends BaseAction {
  readonly pattern = [ACTIONS.GET_KEY, 'key'];

  constructor() {
    super(KeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Если callback_query - редактируем сообщение
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await this.editToDurationSelection(ctx);
    } else {
      // Если команда /key - отправляем новое сообщение
      await ctx.reply(MESSAGES.SELECT_DURATION, {
        reply_markup: durationKeyboard().reply_markup,
      });
    }
  }

  /**
   * Редактирует текущее сообщение на экран выбора срока
   */
  private async editToDurationSelection(
    ctx: CommandContext['ctx'],
  ): Promise<void> {
    try {
      const message = ctx.callbackQuery?.message;
      if (!message) return;

      // Редактируем caption если есть фото, иначе текст
      if ('caption' in message) {
        await ctx.editMessageCaption(MESSAGES.SELECT_DURATION, {
          reply_markup: durationKeyboard().reply_markup,
        });
      } else {
        await ctx.editMessageText(MESSAGES.SELECT_DURATION, {
          reply_markup: durationKeyboard().reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to edit message: ${error}`);
      // Fallback на новое сообщение
      await ctx.reply(MESSAGES.SELECT_DURATION, {
        reply_markup: durationKeyboard().reply_markup,
      });
    }
  }
}

@Injectable()
export class Month1Command extends BaseAction {
  readonly pattern = ACTIONS.MONTH_1;

  constructor() {
    super(Month1Command.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('month_1', userId);

    const price = ACCESS_PRICES.find((p) => p.months === 1);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Генерируем тестовый ключ (в реальности - получать от VPN API)
    const key = this.generateKey(userId, 1);

    await this.sendKey(ctx, price.label, key);
  }

  private generateKey(userId: number, months: number): string {
    // Временная заглушка - в реальности интеграция с VPN API
    const timestamp = Date.now().toString(36).toUpperCase();
    return `VPN-${userId}-${months}M-${timestamp}`;
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}

@Injectable()
export class Month3Command extends BaseAction {
  readonly pattern = ACTIONS.MONTH_3;

  constructor() {
    super(Month3Command.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('month_3', userId);

    const price = ACCESS_PRICES.find((p) => p.months === 3);
    if (!price) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    // Генерируем тестовый ключ
    const key = this.generateKey(userId, 3);

    await this.sendKey(ctx, price.label, key);
  }

  private generateKey(userId: number, months: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `VPN-${userId}-${months}M-${timestamp}`;
  }

  private async sendKey(
    ctx: CommandContext['ctx'],
    duration: string,
    key: string,
  ): Promise<void> {
    try {
      await ctx.reply(MESSAGES.KEY_READY(duration, key), {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      this.logger.error(`Failed to send key: ${error}`);
      await ctx.reply(MESSAGES.ERROR);
    }
  }
}
