import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import {
  INSTRUCTIONS_MESSAGES,
  INSTRUCTIONS_ACTIONS,
  NAVIGATION_ACTIONS,
  instructionsKeyboard,
} from '../../ui';

@Injectable()
export class InstructionsCommand extends BaseAction {
  readonly pattern = [
    INSTRUCTIONS_ACTIONS.INSTRUCTIONS,
    NAVIGATION_ACTIONS.BACK_TO_INSTRUCTIONS,
  ];

  constructor() {
    super(InstructionsCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    this.logExecution(context.data, context.userId);

    await ctx.reply(INSTRUCTIONS_MESSAGES.SELECT_PLATFORM, {
      parse_mode: 'Markdown',
      ...instructionsKeyboard(),
    });
  }
}
