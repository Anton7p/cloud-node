import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { INSTRUCTIONS_MESSAGES, INSTRUCTIONS_PATTERNS, platformInfoKeyboard } from '../../ui';

@Injectable()
export class PlatformInstructionCommand extends BaseAction {
  readonly pattern = INSTRUCTIONS_PATTERNS.PLATFORM_INSTRUCTION;

  constructor() {
    super(PlatformInstructionCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, args } = context;
    this.logExecution(context.data, context.userId);

    const platform = args[0];

    if (!platform) {
      this.logger.error('No platform argument found');
      return;
    }

    await ctx.reply(INSTRUCTIONS_MESSAGES.PLATFORM_INFO(platform), {
      parse_mode: 'Markdown',
      ...platformInfoKeyboard(),
    });
  }
}
