import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { RentalsService } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import { PROFILE_MESSAGES, PROFILE_ACTIONS, profileKeyboard } from '../../ui';

@Injectable()
export class ProfileCommand extends BaseAction {
  readonly pattern = PROFILE_ACTIONS.PROFILE;

  constructor(
    private readonly usersService: UsersService,
    private readonly rentalsService: RentalsService,
  ) {
    super(ProfileCommand.name);
  }

  async execute(context: CommandContext): Promise<void> {
    const { ctx, userId } = context;
    this.logExecution(context.data, userId);

    const user = await this.usersService.findByTelegramId(userId);
    const rental = await this.rentalsService.getRental(userId);
    const rentalData = this.rentalsService.toRentalData(rental);

    if (!user) {
      await ctx.reply(PROFILE_MESSAGES.NOT_FOUND);
      return;
    }

    await ctx.reply(PROFILE_MESSAGES.PROFILE(user, rentalData), {
      parse_mode: 'Markdown',
      ...profileKeyboard(),
    });
  }
}
