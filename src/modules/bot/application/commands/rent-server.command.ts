import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { RENT_MESSAGES, RENT_ACTIONS, rentServerKeyboard } from '../../ui';

@Injectable()
export class RentServerCommand extends BaseAction {
  readonly pattern = RENT_ACTIONS.RENT_SERVER;

  constructor() {
    super(RentServerCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    this.logExecution(context.data, context.userId);

    await ctx.reply(RENT_MESSAGES.SELECT_TERM(), {
      parse_mode: 'Markdown',
      ...rentServerKeyboard(),
    });
  }
}
