import { Injectable } from '@nestjs/common';
import { BaseAction, CommandContext } from '../base.action';
import { PROFILE_MESSAGES, PROFILE_ACTIONS, referralKeyboard } from '../../ui';

@Injectable()
export class ReferralCommand extends BaseAction {
  readonly pattern = PROFILE_ACTIONS.REFERRAL;

  constructor() {
    super(ReferralCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx } = context;
    this.logExecution(context.data, context.userId);

    // Typing эффект для атмосферы
    await ctx.sendChatAction('typing');

    await ctx.reply(PROFILE_MESSAGES.REFERRAL_TITLE, {
      parse_mode: 'Markdown',
      ...referralKeyboard(),
    });
  }
}
