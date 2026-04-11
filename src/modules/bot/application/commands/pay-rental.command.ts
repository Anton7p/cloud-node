import { Injectable } from '@nestjs/common';
import { RentalsService, RentalStatus } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import { RENT_MESSAGES, RENT_ACTIONS, rentActivatedKeyboard } from '../../ui';

@Injectable()
export class PayRentalCommand extends BaseAction {
  readonly pattern = RENT_ACTIONS.PAY_RENTAL;

  constructor(private readonly rentalsService: RentalsService) {
    super(PayRentalCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution(context.data, userId);

    // Typing эффект для атмосферы
    await ctx.sendChatAction('typing');

    const rental = await this.rentalsService.getRental(userId);

    if (!rental || rental.status !== RentalStatus.PENDING) {
      await ctx.reply(RENT_MESSAGES.NO_PENDING_RENTAL);
      return;
    }

    const activatedRental = await this.rentalsService.activateRental(userId);
    if (!activatedRental || !activatedRental.endDate) {
      await ctx.reply(RENT_MESSAGES.ACTIVATION_ERROR);
      return;
    }

    const endDate = activatedRental.endDate.toLocaleDateString('ru-RU');

    await ctx.reply(RENT_MESSAGES.RENT_ACTIVATED(endDate), {
      parse_mode: 'Markdown',
      ...rentActivatedKeyboard(),
    });
  }
}
