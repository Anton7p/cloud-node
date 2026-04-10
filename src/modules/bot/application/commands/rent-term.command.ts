import { Injectable } from '@nestjs/common';
import { RentalsService } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import { RENT_MESSAGES, RENT_PATTERNS, UI_UTILS, rentTermDetailsKeyboard } from '../../ui';

@Injectable()
export class RentTermCommand extends BaseAction {
  readonly pattern = RENT_PATTERNS.RENT_TERM;

  constructor(private readonly rentalsService: RentalsService) {
    super(RentTermCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId, args } = context;
    this.logExecution(context.data, userId);

    const months = parseInt(args[0], 10);

    if (isNaN(months)) {
      this.logger.error(`Invalid months argument: ${args[0]}`);
      return;
    }

    await this.rentalsService.createPendingRental(userId, months);

    const priceInfo = UI_UTILS.getRentalPrice(months);
    const priceLabel = priceInfo ? `${priceInfo.price}$` : 'Неизвестно';

    await ctx.reply(RENT_MESSAGES.TERM_DETAILS(months, priceLabel), {
      parse_mode: 'Markdown',
      ...rentTermDetailsKeyboard(),
    });
  }
}
