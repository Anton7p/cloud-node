import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UsersService } from '../../../users/users.service';
import { RentalsService } from '../../../rentals/rentals.service';
import { BaseAction, CommandContext } from '../base.action';
import {
  PROFILE_MESSAGES,
  PROFILE_ACTIONS,
  profileKeyboard,
  HUD_ICONS,
} from '../../ui';

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

    // Typing эффект для атмосферы
    await ctx.sendChatAction('typing');

    // Отправка HUD иконки профиля
    await this.sendHudIcon(ctx, HUD_ICONS.PROFILE);

    const user = await this.usersService.findByTelegramId(userId);
    const rental = await this.rentalsService.getRental(userId);
    const rentalData = this.rentalsService.toRentalData(rental);

    if (!user) {
      await ctx.reply(PROFILE_MESSAGES.NOT_FOUND, { parse_mode: 'Markdown' });
      return;
    }

    await ctx.reply(PROFILE_MESSAGES.PROFILE(user, rentalData), {
      parse_mode: 'Markdown',
      ...profileKeyboard(),
    });
  }

  /**
   * Отправляет HUD иконку если файл существует
   */
  private async sendHudIcon(
    ctx: CommandContext['ctx'],
    iconPath: string,
  ): Promise<void> {
    try {
      const fullPath = path.resolve(iconPath);
      if (fs.existsSync(fullPath)) {
        await ctx.replyWithPhoto({ source: fullPath });
      }
    } catch (error) {
      // Иконка не критична, продолжаем без неё
    }
  }
}
