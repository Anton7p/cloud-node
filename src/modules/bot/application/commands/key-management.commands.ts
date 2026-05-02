import { Injectable } from '@nestjs/common';
import { RentalsService } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import { MESSAGES, ACTIONS, keyDisplayKeyboard } from '../../ui';

@Injectable()
export class CopyKeyCommand extends BaseAction {
  readonly pattern = /^copy_key:/;

  constructor() {
    super(CopyKeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, data } = context;
    this.logExecution('copy_key', userId);

    const key = data?.replace('copy_key:', '') || '';
    if (!key) {
      await ctx.reply(MESSAGES.COPY_KEY_ERROR);
      return;
    }

    await ctx.reply(MESSAGES.COPY_KEY_READY(key), {
      parse_mode: 'Markdown',
    });
  }
}

@Injectable()
export class MyKeyCommand extends BaseAction {
  readonly pattern = [ACTIONS.MY_KEYS, 'mykey'];

  constructor(private readonly rentalsService: RentalsService) {
    super(MyKeyCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution('my_key', userId);

    const rental = await this.rentalsService.getActiveRental(userId);
    if (!rental || !rental.accessKey) {
      await ctx.reply(MESSAGES.NO_KEY);
      return;
    }

    const key = await this.rentalsService.getDecryptedAccessKey(rental);
    if (!key) {
      await ctx.reply(MESSAGES.ERROR);
      return;
    }

    await ctx.reply(MESSAGES.MY_KEY_TITLE, { parse_mode: 'Markdown' });
    await ctx.reply(`\`\`\`\n${key}\n\`\`\``, {
      parse_mode: 'Markdown',
      reply_markup: keyDisplayKeyboard(key).reply_markup,
    });
  }
}
