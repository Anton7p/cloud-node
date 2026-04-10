import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { PROFILE_MESSAGES, PROFILE_ACTIONS, helpKeyboard } from '../../ui';

@Injectable()
export class HelpCommand extends BaseAction {
  readonly pattern = PROFILE_ACTIONS.HELP;

  constructor() {
    super(HelpCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    this.logExecution(context.data, context.userId);

    await ctx.reply(PROFILE_MESSAGES.HELP_TITLE, {
      parse_mode: 'Markdown',
      ...helpKeyboard(),
    });
  }
}
