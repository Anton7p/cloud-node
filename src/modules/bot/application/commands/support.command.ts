import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, backKeyboard } from '../../ui';

@Injectable()
export class SupportCommand extends BaseAction {
  readonly pattern = [ACTIONS.SUPPORT, 'support'];

  constructor() {
    super(SupportCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Если callback_query - редактируем сообщение
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await this.editToSupport(ctx);
    } else {
      // Если команда /support - отправляем новое сообщение
      await ctx.reply(MESSAGES.SUPPORT, {
        reply_markup: backKeyboard().reply_markup,
      });
    }
  }

  /**
   * Редактирует текущее сообщение на экран поддержки
   */
  private async editToSupport(ctx: CommandContext['ctx']): Promise<void> {
    try {
      const message = ctx.callbackQuery?.message;
      if (!message) return;

      // Редактируем caption если есть фото, иначе текст
      if ('caption' in message) {
        await ctx.editMessageCaption(MESSAGES.SUPPORT, {
          reply_markup: backKeyboard().reply_markup,
        });
      } else {
        await ctx.editMessageText(MESSAGES.SUPPORT, {
          reply_markup: backKeyboard().reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to edit message: ${error}`);
      // Fallback на новое сообщение
      await ctx.reply(MESSAGES.SUPPORT, {
        reply_markup: backKeyboard().reply_markup,
      });
    }
  }
}
