import { Injectable } from '@nestjs/common';
import { RentalsService } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import {
  PROFILE_MESSAGES,
  PROFILE_ACTIONS,
  noServersKeyboard,
  accessInfoKeyboard,
  UI_UTILS,
} from '../../ui';

@Injectable()
export class GetAccessCommand extends BaseAction {
  readonly pattern = PROFILE_ACTIONS.GET_ACCESS;

  constructor(private readonly rentalsService: RentalsService) {
    super(GetAccessCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution(context.data, userId);

    const rental = await this.rentalsService.getActiveRental(userId);

    if (!rental || !rental.endDate) {
      await ctx.reply(PROFILE_MESSAGES.NO_ACTIVE_SERVERS, {
        parse_mode: 'Markdown',
        ...noServersKeyboard(),
      });
      return;
    }

    const password = UI_UTILS.generatePassword(userId);
    const endDate = rental.endDate.toLocaleDateString('ru-RU');

    await ctx.reply(PROFILE_MESSAGES.ACCESS_INFO(userId, endDate, password), {
      parse_mode: 'Markdown',
      ...accessInfoKeyboard(),
    });
  }
}
