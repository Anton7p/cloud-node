import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext, safeDeleteMessage } from '../base.action';
import { MESSAGES, ACTIONS, legalKeyboard } from '../../ui';

@Injectable()
export class SupportCommand extends BaseAction {
  readonly pattern = [ACTIONS.SUPPORT, 'support'];

  constructor() {
    super(SupportCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution(data, userId);

    // Режим одного окна: удаляем старое сообщение и отправляем новое
    await safeDeleteMessage(ctx);
    await ctx.reply(MESSAGES.SUPPORT, {
      reply_markup: legalKeyboard().reply_markup,
    });
  }
}
