import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, platformKeyboard } from '../../ui';

@Injectable()
export class InstructionsCommand extends BaseAction {
  readonly pattern = [ACTIONS.INSTRUCTIONS, 'help'];

  constructor() {
    super(InstructionsCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Если callback_query - редактируем сообщение
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await this.showPlatformSelection(ctx);
    } else {
      // Если команда /help - отправляем новое сообщение
      await ctx.reply(MESSAGES.INSTRUCTIONS_TITLE, {
        reply_markup: platformKeyboard().reply_markup,
      });
    }
  }

  /**
   * Показывает выбор платформы через редактирование сообщения
   */
  private async showPlatformSelection(
    ctx: CommandContext['ctx'],
  ): Promise<void> {
    try {
      await ctx.editMessageText(MESSAGES.INSTRUCTIONS_TITLE, {
        reply_markup: platformKeyboard().reply_markup,
      });
    } catch (error) {
      this.logger.warn(`Failed to edit message: ${error}`);
      await ctx.reply(MESSAGES.INSTRUCTIONS_TITLE, {
        reply_markup: platformKeyboard().reply_markup,
      });
    }
  }
}
