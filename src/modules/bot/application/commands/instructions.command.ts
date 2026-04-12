import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, IMAGES, platformKeyboard } from '../../ui';

/**
 * Утилита для безопасного удаления сообщения
 */
async function safeDeleteMessage(ctx: CommandContext['ctx']): Promise<void> {
  try {
    if (ctx.callbackQuery && 'message' in ctx.callbackQuery) {
      await ctx.deleteMessage();
    }
  } catch (error) {
    // Игнорируем ошибку удаления
  }
}

@Injectable()
export class InstructionsCommand extends BaseAction {
  readonly pattern = [ACTIONS.INSTRUCTIONS, 'help'];

  constructor() {
    super(InstructionsCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Режим одного окна: удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);
    await this.sendWithImage(ctx);
  }

  /**
   * Отправляет новое сообщение с картинкой инструкций
   */
  private async sendWithImage(ctx: CommandContext['ctx']): Promise<void> {
    try {
      const imagePath = path.resolve(IMAGES.INSTRUCTIONS_HUD);

      if (fs.existsSync(imagePath)) {
        await ctx.replyWithPhoto(
          { source: imagePath },
          {
            caption: MESSAGES.INSTRUCTIONS_TITLE,
            reply_markup: platformKeyboard().reply_markup,
          },
        );
      } else {
        await ctx.reply(MESSAGES.INSTRUCTIONS_TITLE, {
          reply_markup: platformKeyboard().reply_markup,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to send photo: ${error}`);
      await ctx.reply(MESSAGES.INSTRUCTIONS_TITLE, {
        reply_markup: platformKeyboard().reply_markup,
      });
    }
  }
}
